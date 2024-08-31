  // Helper functions to extract specific information from the long description
  export const extractIngredients = description => {
    const ingredientsMatch = description.match(/Ingredientes:(.*?)(?=<\/p>)/s);
    return ingredientsMatch ? ingredientsMatch[1].trim() : null;
  };
  
export const extractAnalyticalComponents = description => {
    const componentsMatch = description.match(/Componentes analíticos:(.*?)(?=<\/p>)/s);
    return componentsMatch ? componentsMatch[1].trim() : null;
};
  
export const extractKeyFeatures = description => {
    const featuresMatch = description.match(/<strong>Características:<\/strong><\/p>\s*<ul>(.*?)<\/ul>/s);
    if (featuresMatch) {
      return featuresMatch[1]
        .match(/<li>(.*?)<\/li>/g)
        ?.map(item => item.replace(/<\/?li>/g, '').trim())
        ?? [];
    }
    return null;
};
