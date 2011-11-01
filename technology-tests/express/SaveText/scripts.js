var products = [
{
  id: 1,
  name: 'Mac Book Pro',
  content: 'Apple 13 inch macbook'
},
{
  id: 2,
  name: 'iPad',
  content: 'Apple iPad'
},
{
  id: 3,
  name: 'iPhone',
  content: 'Apple iPhone'
}
];

module.exports.all = products;

module.exports.find = function(id){
  id = parseInt(id, 10);
  for(i in products)
    if(products[i].id == id)
      return products[i];
};

module.exports.new = function() {
  return {
    name:'',
    content:''
  };
}

module.exports.insert = function(product) {
  var id = products.length;
  product.id = id;
  products[id - 1] = product;
  return id;
}

module.exports.setContent = function(id, content) {
  id = parseInt(id, 10);
  products[id - 1].content = content;
};
