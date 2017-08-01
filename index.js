const express = require("express");
const PROT_NUM = 3000;
const fs = require("fs");

function hasSameAttrs(sku1, sku2) {
    let result = true;

    for(let attr in sku1.attrs) {
        result = result && sku1.attrs[attr] === sku2.attrs[attr];
    }

    return result;
}

function hasMoreAttrs(sku1, sku2) {
    return Object.keys(sku1.attrs).length > Object.keys(sku2.attrs);
}

function removeDuplicatedSkus(skus) {
    return skus.reduce((newSkus, sku) => {
        const sameAttrsIndex = newSkus.findIndex(newSku => hasSameAttrs(sku, newSku));

        if(sameAttrsIndex === -1) {
            newSkus.push(sku);
        } else if(hasMoreAttrs(sku, newSkus[sameAttrsIndex])) {
            newSkus.splice(sameAttrsIndex, 1, sku);
        }

        return newSkus;
    }, []);
}

function addSkuId(skus) {
    return skus.map((sku, index) => { sku.id = index; return sku; });
}

function getData(req, res) {
    fs.readFile("./skus.json", "utf-8", (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const { skus } = JSON.parse(data);
            res.send(addSkuId(removeDuplicatedSkus(skus)));
        }
    });
}

express()
    .use(express.static("./"))
    .get("/product-selector-data", getData)
    .listen(PROT_NUM, () => {
        console.log(`SERVER STARTED AT ${PROT_NUM}`);
    });
