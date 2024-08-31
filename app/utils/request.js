export const isValidUrl = url => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        this.logger.debug(`Invalid URL: ${url}`);
        return false;
    }
}

export const isInScope = (url, scope) => {
    const inScope = scope.test(url);
    if (!inScope) {
        this.logger.debug(`URL out of scope: ${url}`);
    }
    return inScope;
}