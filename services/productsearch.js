var jdb = require('./jdb');
var fdb = require('/etc/fDb');
var upcDb = require('./upcDatabase');
var walmartComDb = require('./walmartCom');
var chuckNorris = require('./chuckNorris')

module.exports = function(barcode, req, res) {

    useItemId(jdb[toWmUpc(barcode)]);

    function useItemId(itemId) {
	if (itemId)
	    walmartComDb.lookupByItemId(itemId, handleWalmartCom);
	else
	    searchFdb();
    }

    function handleWalmartCom(error, response, body) {
	if (!error && response.statusCode == 200)
	    renderWalmartCom(barcode, JSON.parse(body));
	else
	    searchFdb();
    }

    function renderWalmartCom(upc, body) {
	console.log(body);
	res.render('walmartCom.html', 
		   { name: body.name,
		     country: "Country",
		     productPage: body.url
		   });
    }

    function searchFdb() {
	var priceAndCountry = lookupPriceAndCountry();
	
	if (priceAndCountry) {
	    var price = priceAndCountry.split('|')[0];
	    var country = priceAndCountry.split('|')[1];

	    upcDb.lookup(barcode, handleUpcLookup);

	    function handleUpcLookup(error, value) {
		console.log(JSON.stringify(value));
		name = value.status == "fail" ? "We found a price" : value.description;
		country = value.status == "fail" ? country : value.issuerCountry;
		res.render('fDb.html', 
			   { 'name': name,
			     'price': price,
			     'country': country, 
			     productPage: 'http://upcdata.info/lookup/' + barcode});
	    }
	}
	else
	    searchUpcDb();
    }

    function lookupPriceAndCountry() {
	return fdb.fdb[toWmUpc(barcode)];
    }

    function toWmUpc(barcode) {
	var fDbbarcode = trimNumber(barcode);
	return fDbbarcode.substr(0, fDbbarcode.length - 1);
    }

    function searchUpcDb() {
	upcDb.lookup(barcode, handle);
    }

    function handle(error, value) {
	if (value.status == "fail")
	    chuckNorris(req, res);
	else
	    onSuccess(value)}

    function onSuccess(value) {
	console.log(JSON.stringify(value));
	res.render('product.html', 
		   { name: value.description || "Some product",
		     country: value.issuerCountry || "some country",
		     productPage: 'http://upcdata.info/lookup/' + barcode})}
		     
}

function trimNumber(s) {
    while (s.substr(0,1) == '0' && s.length>1) { s = s.substr(1); }
    return s;
}
