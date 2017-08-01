const productSelectorTmpl = require("./product-selector.html");
const serviceName = "selectorService";
const directiveName = "productSelector";

function setupTmpl($templateCache) {
    $templateCache.put("product-selector.html", productSelectorTmpl);
}

function productSelectorCtrl($http, selectorService, $timeout) {
    const self = this;
    self.initalized = undefined;
    self.getSelectorStatus = () => selectorService.getSelectorStatus(self);

    function initalize(response) {
        self.initalized = true;
        self.selectedAttrs = [];
        self.skus = response.data;
        self.allAttrs = selectorService.getAllAttrs(self);
        self.getSelectedSku = () => selectorService.getSelectedSku(self);
        self.clickingAtAttrValue = (attrValue, attr) => selectorService.clickingAtAttrValue(attrValue, attr, self);

    }

    function failToInitialize() {
        self.initalized = false;
    }

    $http
        .get("/product-selector-data")
        .then(res => $timeout(initalize.bind(null, res), 1000), failToInitialize);
}

function service() {
    const INVALID = "invalid";
    const VALID = "valid";
    const SELECTED = "selected";
    const ALLCOMBINATIONS = [];

    function storeAllCombinations(sku) {
        ALLCOMBINATIONS
            .push(
                Object.keys(sku.attrs).map(attr => `${attr}:${sku.attrs[attr]}`));
    }

    function mapAttrvalueIntoAttrs(incomingAttrValue, attr, attrs) {
        if (attrs[attr]) {
            if (!attrs[attr].includes(incomingAttrValue)) {
                attrs[attr].push(incomingAttrValue);
            }
        } else {
            attrs[attr] = [incomingAttrValue];
        }
    }

    function mapAttrValueWithInitialStatus(allAttrs) {
        for (let attr in allAttrs) {
            const newAttrValue = allAttrs[attr].map(attrValue => ({value: attrValue, status: VALID}))
            allAttrs[attr].splice(0, attr.length, ...newAttrValue);
        }

        return allAttrs;
    }

    function selectOnlyOneForEachAttr(clickedValue, clickedAttr, allValuesInOneAttr) {
        if (clickedValue.status === SELECTED) {
            allValuesInOneAttr
                .forEach(attrValue => { attrValue.status = VALID; });
        } else {
            allValuesInOneAttr
                .filter(attrValue => attrValue.status === SELECTED)
                .forEach(attrValue => { attrValue.status = VALID; });
            clickedValue.status = SELECTED;
        }
    }

    function maintainSelectedAttrs(clickedValue, clickedAttr, scope) {
        const clickedAttr_value = `${clickedAttr}:${clickedValue.value}`;
        const clickedAttr_valueIndex = scope.selectedAttrs.findIndex(selectedAttr => selectedAttr === clickedAttr_value);
        const sameSelectedAttrIndex = scope.selectedAttrs.findIndex(selectedAttr => selectedAttr.includes(clickedAttr));

        if (clickedAttr_valueIndex > -1) {
            scope.selectedAttrs.splice(clickedAttr_valueIndex, 1);
        } else if (sameSelectedAttrIndex > -1) {
            scope.selectedAttrs.splice(sameSelectedAttrIndex, 1, clickedAttr_value);
        } else {
            scope.selectedAttrs.push(clickedAttr_value);
        }
    }

    function getPossibleCombinations(selectedAttrs) {
        return ALLCOMBINATIONS
            .filter(combination =>
                selectedAttrs.every(selectedAttr => combination.includes(selectedAttr))
            );
    }

    function getAttrsNotSelected(possibleCombinations, selectedAttrs) {
        return possibleCombinations
            .reduce((restAttrs, combination) => {
                combination
                    .filter(attr_value => !selectedAttrs.includes(attr_value))
                    .forEach(attr_value => {
                        const [attr, value] = attr_value.split(":");

                        mapAttrvalueIntoAttrs(value, attr, restAttrs);
                    });
                return restAttrs;
            }, {});
    }

    function updateRestAttrs(scope) {
        const possibleCombinations = getPossibleCombinations(scope.selectedAttrs);
        const attrs = getAttrsNotSelected(possibleCombinations, scope.selectedAttrs);

        Object.keys(attrs)
            .forEach(attr => {
                scope.allAttrs[attr].forEach(attrValue => {
                    if (!attrs[attr].includes(attrValue.value) && attrValue.status !== SELECTED) {
                        attrValue.status = INVALID;
                    } else {
                        attrValue.status = VALID;
                    }
                });
            });
    }

    this.getSelectorStatus = (scope) => (
        scope.initalized === true ? "done"
        : scope.initalized === false ? "fail"
        : "in-progress"
    );

    this.getAllAttrs = (scope) => {
        if (!scope.skus) {
            return;
        }

        const allAttrs = scope.skus
            .reduce((attrs, sku) => {
                Object.keys(sku.attrs)
                    .forEach(attr => {
                        const incomingAttrValue = sku.attrs[attr];

                        mapAttrvalueIntoAttrs(incomingAttrValue, attr, attrs)
                    });

                storeAllCombinations(sku);

                return attrs;
            }, {});

        return mapAttrValueWithInitialStatus(allAttrs);
    }

    this.clickingAtAttrValue = (clickedValue, clickedAttr, scope) => {
        if (clickedValue.status !== INVALID) {
            selectOnlyOneForEachAttr(clickedValue, clickedAttr, scope.allAttrs[clickedAttr])
            maintainSelectedAttrs(clickedValue, clickedAttr, scope);
            updateRestAttrs(scope);
        }
    };

    this.getSelectedSku = (scope) => {
        if (scope.selectedAttrs.length === 3) {
            return scope.skus.find(sku => {
                const attr_valus = scope.selectedAttrs.map(attr_value => attr_value.split(":"));

                return attr_valus.every(([attr, value]) => sku.attrs[attr] === value);
            })
        }
    }
}

function directive($templateCache) {
    return ({
        template: $templateCache.get("product-selector.html"),
        controller: ["$http", "selectorService", "$timeout", productSelectorCtrl],
        controllerAs: "ctrl",
        restrict: "E",
        scope: {}
    });
}

module.exports = {
    setupTmpl,
    serviceName,
    service,
    directiveName,
    directive
};
