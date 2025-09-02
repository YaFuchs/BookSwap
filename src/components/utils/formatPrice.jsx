const formatPrice = (priceAgorot) => {
    if (priceAgorot === null || priceAgorot === undefined) return "לא צוין";
    return `₪${(priceAgorot / 100).toFixed(2)}`;
};

export { formatPrice };