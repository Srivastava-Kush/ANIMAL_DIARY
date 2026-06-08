import * as tf from '@tensorflow/tfjs'

// ── Register preprocessing layers missing from TFjs 4.x layer registry ──────

class Normalization extends tf.layers.Layer {
  constructor(config) {
    super(config)
    this.axis = config.axis
    this._mean = config.mean ?? null
    this._variance = config.variance ?? null
  }
  call(inputs) {
    const x = Array.isArray(inputs) ? inputs[0] : inputs
    if (this._mean === null || this._variance === null) return x
    return tf.tidy(() => {
      const mean = tf.tensor(this._mean)
      const std = tf.sqrt(tf.tensor(this._variance).add(1e-3))
      return x.sub(mean).div(std)
    })
  }
  getConfig() {
    return { ...super.getConfig(), axis: this.axis, mean: this._mean, variance: this._variance }
  }
  static get className() { return 'Normalization' }
}
tf.serialization.registerClass(Normalization)

class Rescaling extends tf.layers.Layer {
  constructor(config) {
    super(config)
    this.scale = config.scale ?? 1
    this.offset = config.offset ?? 0
  }
  call(inputs) {
    const x = Array.isArray(inputs) ? inputs[0] : inputs
    return tf.tidy(() => x.mul(this.scale).add(this.offset))
  }
  getConfig() {
    return { ...super.getConfig(), scale: this.scale, offset: this.offset }
  }
  static get className() { return 'Rescaling' }
}
tf.serialization.registerClass(Rescaling)

// ────────────────────────────────────────────────────────────────────────────

const SPECIES = [
  'rhesus_macaque',
  'bonnet_macaque',
  'lion_tailed_macaque',
  'hanuman_langur',
  'golden_langur',
  'hoolock_gibbon'
]

const SPECIES_INFO = {
  rhesus_macaque: {
    common: 'Rhesus Macaque',
    scientific: 'Macaca mulatta',
    status: 'Least Concern',
    statusColor: '#22c55e',
    habitat: 'Forests, grasslands, and urban areas across India',
    description: 'Most widespread primate in Asia, highly adaptable and often found near human settlements across India.',
    animalDiaryName: 'Rhesus Macaque'
  },
  bonnet_macaque: {
    common: 'Bonnet Macaque',
    scientific: 'Macaca radiata',
    status: 'Vulnerable',
    statusColor: '#f97316',
    habitat: 'Southern India — Karnataka, Tamil Nadu, Kerala',
    description: 'Endemic to southern India, named for the distinctive whorl of hair on its head resembling a bonnet.',
    animalDiaryName: 'Bonnet Macaque'
  },
  lion_tailed_macaque: {
    common: 'Lion-tailed Macaque',
    scientific: 'Macaca silenus',
    status: 'Endangered',
    statusColor: '#ef4444',
    habitat: 'Western Ghats rainforests',
    description: 'Endemic to Western Ghats, recognized by its striking silver-white mane and jet black fur.',
    animalDiaryName: 'Lion-tailed Macaque'
  },
  hanuman_langur: {
    common: 'Hanuman Langur',
    scientific: 'Semnopithecus entellus',
    status: 'Least Concern',
    statusColor: '#22c55e',
    habitat: 'Forests and urban areas across the Indian subcontinent',
    description: 'Sacred in Hindu culture and the most common langur in India, recognizable by its distinctive black face and hands.',
    animalDiaryName: 'Hanuman Langur'
  },
  golden_langur: {
    common: "Gee's Golden Langur",
    scientific: 'Trachypithecus geei',
    status: 'Endangered',
    statusColor: '#ef4444',
    habitat: 'Assam, India — Bhutan border region',
    description: "Restricted to a tiny region in Assam — one of the most endangered primates in the world with a striking golden coat.",
    animalDiaryName: 'Golden Langur'
  },
  hoolock_gibbon: {
    common: 'Western Hoolock Gibbon',
    scientific: 'Hoolock hoolock',
    status: 'Endangered',
    statusColor: '#ef4444',
    habitat: 'Northeast India — Assam, Meghalaya, Manipur',
    description: "India's only ape, found in Northeast India. Known for elaborate morning duet songs echoing through the forest.",
    animalDiaryName: 'Western Hoolock Gibbon'
  }
}

let model = null

export async function loadModel(onProgress) {
  if (model) return model
  onProgress?.('Loading AI model...')
  model = await tf.loadLayersModel('/tfjs_model/model.json').catch(e => {
    console.error('[classifier] loadLayersModel error:', e)
    throw e
  })
  onProgress?.('Model ready')
  return model
}

export async function classifyImage(imageElement) {
  if (!model) throw new Error('Model not loaded yet')

  const tensor = tf.tidy(() => {
    return tf.browser.fromPixels(imageElement)
      .resizeBilinear([300, 300])
      .toFloat()
      .sub([103.939, 116.779, 123.68])
      .expandDims(0)
  })

  const predictionTensor = model.predict(tensor)
  const predictions = await predictionTensor.data()
  tensor.dispose()
  predictionTensor.dispose()

  const results = SPECIES.map((species, i) => ({
    species,
    info: SPECIES_INFO[species],
    probability: predictions[i]
  })).sort((a, b) => b.probability - a.probability)

  const top = results[0]

  return {
    status: top.probability >= 0.70 ? 'confident' : 'uncertain',
    top,
    all: results
  }
}

export { SPECIES_INFO }
