const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64 = require('base64-img');
const fs = require('fs')

const { Medias } = require('../models');

router.get('/', async (req, res) => {
  const medias = await  Medias.findAll({
    attributes: ['id', 'image']
  });

  const mappedMedia = medias.map((m) => {
    m.image = `${req.get('host')}/${m.image}`
    
    return m;
  });
  

  return res.json({
    status: 'success',
    data: medias
  });
});


router.post('/', (req,res) => {
  const image = req.body.image;

  if(!isBase64(image, {mimeRequired: true})){
    return res.status(400).json({
      status: 'error',
      message: 'invalid base64'
    })
  }

  base64.img(image, './public/images', Date.now(),async (err, filepath) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
    const filename = filepath.split("\\").pop().split("/").pop();

    const medias = await Medias.create({
      image: `images/${filename}`
    });

    return res.status(201).json({
      status: "created",
      data: {
        id: medias.id,
        image: `${req.get('host')}/images/${filename}`
      }
    })
  })
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  const medias = await Medias.findByPk(id);

  if(!medias) {
    return res.status(404).json({
      status: 'error',
      message: 'media not found'
    });
  }

  fs.unlink(`./public/${medias.image}`, async(err) => {
    if(err){
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    await medias.destroy();

    return res.json({
      status: 'success',
      message: 'image deleted'
    })
  })

});

module.exports = router;
