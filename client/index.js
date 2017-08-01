const angular = require("angular");
const productSelector = require("./productSelector.js");

angular
    .module("app", [])
    .run(($templateCache) => {
        productSelector.setupTmpl($templateCache);
    })
    .service(productSelector.serviceName, [productSelector.service])
    .directive(productSelector.directiveName, productSelector.directive);
