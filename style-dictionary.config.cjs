module.exports = {
  source: [
    'design-tokens/core/**/*.json',
    'design-tokens/themes/*.json',
    'design-tokens/figma/**/*.json' // figma token export buraya düşerse override edebilir
  ],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      buildPath: 'public/tokens/',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
          options: { 
            outputReferences: true,
            selector: ':root'
          }
        }
      ]
    },
    tailwind: {
      transformGroup: 'tokens-studio',
      buildPath: 'public/tokens/',
      files: [{
        destination: 'tailwind.json',
        format: 'json/nested'
      }]
    }
  }
};
