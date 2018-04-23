var Shop = function(shopId , shopName) {
	this.shopId = shopId;
	this.shopName = shopName;
};	
var ShopService = (function() {
	var shopServiceInstance;
	function init() {
		function save(shop) {
			var shops = [];
			if(localStorage.shops !== undefined){
				shops = JSON.parse(localStorage.getItem("shops"));
			}
			shops.push(shop);
			localStorage.shops = JSON.stringify(shops);
		}
		function list(shop) {
			var shops = [];
			if(localStorage.shops !== undefined){
				shops = JSON.parse(localStorage.getItem("shops"));
			}
			return shops;
		}
		return {
			save : save,
			list : list,
		};
	}
	return {
		getInstance : function() {
			if (!shopServiceInstance) {
				shopServiceInstance = init();
			}
			return shopServiceInstance;
		}
	};
	function Singleton() {
		if (!shopServiceInstance) {
			shopServiceInstance = intialize();
		}
	};
})();
var shop = new Shop("1", "2");
var shopService = ShopService.getInstance();

console.log(shopService.list())
