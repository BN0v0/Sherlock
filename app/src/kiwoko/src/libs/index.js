export const safeGet = (obj, path, defaultValue = null) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? defaultValue;
};

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

export const extractPricing = (product) => {
  const getPrice = (type) => ({
    value: safeGet(product, `price.${type}.value`),
    currency: safeGet(product, `price.${type}.currency`),
  });

  const hasListPrice = safeGet(product, 'price.list');
  const regularPrice = hasListPrice ? getPrice('list') : getPrice('sales');
  const promoPrice = hasListPrice ? getPrice('sales') : { value: null, currency: null };

  return {
    regularPrice,
    promoPrice,
    unitPrice: {
      value: safeGet(product, 'variationAttributes.0.values.0.pricePerUnit.value'),
      currency: safeGet(product, 'variationAttributes.0.values.0.pricePerUnit.currencyCode'),
      unit: safeGet(product, 'variationAttributes.0.values.0.unitQuantity.unit'),
    },
  };
};

export const createDetailedTime = () => {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    year: now.getFullYear(),
    month: now.getMonth() + 1, // getMonth() returns 0-11
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
    millisecond: now.getMilliseconds(),
    dayOfWeek: now.getDay(), // 0-6, where 0 is Sunday
    weekOfYear: getWeekNumber(now),
  };
};

// Helper function to get week number
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};
