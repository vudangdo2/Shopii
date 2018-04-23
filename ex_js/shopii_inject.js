(function() {
	iOSRemoveBottomInset();
	var IS_LOADING = false;
	var IS_NO_MORE = false;
	var LOAD_MORE_THRESHOLD = 50;
	var LOAD_MORE_BATCH = 20;
	var OFFSET_OF_OFFSET = 0;
	$(function() {
		$('.shop-href').off('tap').on('tap', function(e) {
			e.stopPropagation();
			e.preventDefault();
			var $this = $(this);
			var url = $this.attr('href');
			navigate(url);
		});
		$('.follower-list').on('click', '.btn-follow', function(e) {
			if (window.WebViewJavascriptBridge) {
				window.WebViewJavascriptBridge.callHandler("login", {}, function(re) {
					if (re.status == 1) {
						fav_handler(e);
					}
				});
			} else if (loggedin) {
				fav_handler(e);
			} else {
				askLogin();
			}
		});
		$('.follower-list').on('tap', '.btn-remove', function(e) {
			if (is_following) {
				var shopID = $(e.currentTarget).attr("data-delete-id");
				$.post("/buyer/unfollow/shop/" + shopID + "/", {
					"csrfmiddlewaretoken": csrf
				}, function(data) {
					--OFFSET_OF_OFFSET;
					notifyFollowUserUpdate(0, shopID);
					if (is_owner) {
						$(e.currentTarget).parent().hide();
					} else {
						$(e.currentTarget).hide();
					}
					alert_message(msg_deleted_following_removed);
				}).fail(function(e) {
					alert_message(msg_server_error);
				});
			} else {
				$.post("remove", {
					"follower_id" : $(e.currentTarget).attr("data-delete-id"),
					"csrfmiddlewaretoken": csrf
				}).success(function(data) {
					var isSuccess = data.success;
					if (isSuccess) {
						--OFFSET_OF_OFFSET;
						notifyFollowUserUpdate(0, shopID);
						$(e.currentTarget).parent().hide();
						alert_message(msg_deleted_follower_removed);
					} else {
						alert_message(msg_server_error);
					}
				});
			}
		});
		bridgeInit(function(bridge) {
			setTimeout(function() {
				var url = window.location.href;
				if (url.indexOf('follower') != -1) {
					var page = label_follower;
				} else if (url.indexOf('following') != -1) {
					var page = label_following;
				}
				bridgeCallHandler("configureNavBarTitle", {
					title: page
				});
			}, 200);
		});
		$(window).on('scroll', tryToLoadMore);
	});
	function notifyFollowUserUpdate(followed, shopID) {
		if (window.WebViewJavascriptBridge) {
			window.WebViewJavascriptBridge.callHandler("webNotify", {
				notifyType: 'notifyFollowUserUpdate',
				shopID: shopID,
				followed: followed
			});
		}
	};
	function fav_handler(e) {
		var lock_class= "shopee_disabled";
		var elm = $(e.currentTarget);
		var shopID = elm.attr('shopid');
		function tempLock() {
			elm.addClass(lock_class);
			setTimeout(function() {
				elm.removeClass(lock_class);
			}, 600);
		};
		if (!elm.hasClass(lock_class)) {
			if (!elm.hasClass("active")) {
				$.post("/buyer/follow/shop/" + shopID + "/", {
					"csrfmiddlewaretoken": csrf
				}, function(e) {
					++OFFSET_OF_OFFSET;
					tempLock();
					elm.addClass("active").text(label_following);
					notifyFollowUserUpdate(1, shopID);
				}).fail(function(e) {
					onFavFail(parseInt(e.responseText));
				});
			}
		}
	}
	function onFavFail(errorCode) {
		if (errorCode == 3) {
			// limit
			alert_message(alert_follow_limit);
		} else if (errorCode == 15) {
			// too frequent
			alert_message(alert_follow_too_frequent);
		}
	}
	function tryToLoadMore() {
		if (!IS_NO_MORE && !IS_LOADING) {
			var scrollTop = scrollTopFunc();
			var windowHeight = $(window).height();
			var documentHeight = $(document).height();
			var tillEnd = documentHeight-windowHeight-scrollTop;
			if (tillEnd < LOAD_MORE_THRESHOLD) {
				loadMore();
			}
		} else {
		}
	}
	function loadMore() {
		IS_LOADING = true;
		toggleLoadingText(IS_LOADING);
		var cursor = parseInt($(".follower-list li:last-child").attr("data-follower-cursor"));
		if (isNaN(cursor) || cursor == '') {
			cursor = 0;
		}
		var data = {
			offset: cursor + 1,
			limit: LOAD_MORE_BATCH,
			offset_of_offset: OFFSET_OF_OFFSET
		};
		$.get(load_more_url + '?' + $.param(data), function(response) {
			if (response.no_more) {
				IS_NO_MORE = true;
				if (is_following) {
					$('.loading-text').html(i18n.t('msg_no_more_following'));
				} else {
					$('.loading-text').html(i18n.t('msg_no_more_followers'));
				}
			} else {
				$(".follower-list").append(response);
				removeDuplicates();
				toggleLoadingText(IS_LOADING);
			}
			IS_LOADING = false;
			$('.shop-href').off('tap').on('tap', function(e) {
				e.stopPropagation();
				e.preventDefault();
				var $this = $(this);
				var url = $this.attr('href');
				navigate(url);
			});
		}).fail(function() {
			alert_message(i18n.t("msg_fail_to_load_more_followers"));
			IS_LOADING = false;
			toggleLoadingText(IS_LOADING);
		});
		$('.shop-href').off('tap').on('tap', function(e) {
			e.stopPropagation();
			e.preventDefault();
			var $this = $(this);
			var url = $this.attr('href');
			navigate(url);
		});
	}
	function removeDuplicates() {
		var existingId = {};
		$(".follower-list").children().each(function(index, item) {
			var $item = $(item);
			var shopId = $item.attr('data-follower-shop-id');
			if (shopId in existingId) {
				$item.remove();
			} else {
				existingId[shopId] = true;
			}
		});
	}
	function toggleLoadingText(should_display) {
		var followerList = $('.follower-list');
		if (followerList.children().length > 1 ||
			followerList.find('.empty_holder').length == 0) {
			$('.loading-text').toggle(should_display);
		}
	}
})();

var customLog = function(msg , spaceLength = 0){
	if(spaceLength == 0 ){
		return console.log(msg);
	}else{
		let space_ = " ";
		for(let i = 0 ; i <	 spaceLength; i++){
			space_+=space_;
		}
		console.log(space_+msg);
	}
}

var SYS_SECOND_TIME = 2;
var PAGE_LENGTH = 20;
var shopName = "Shop 1 ";
var index = 0;
var pageIndex = 0;
var totalFollower = 1;
var sizeLength = $('.btn-follow').length;

var loadPage = function(){
	$("html, body").animate({ scrollTop: $(document).height() }, 1000);
	var intervalTryLoad = setInterval(function(){
		if($('.loading-text').text().indexOf('Không thể tìm') > -1){
			window.clearInterval(intervalTryLoad);
			end();
		}
		if($('.btn-follow').length > sizeLength){
			customLog('page - ' + pageIndex++, 1);
			sizeLength = $('.btn-follow').length;
			follwer(sizeLength);
			window.clearInterval(intervalTryLoad);
		}
	},500);
}
var follwer = function(length){
	if(length  > index){
		let username = $($($('.btn-follow')[index]).parent()[0]).find('div:eq(1) > div:eq(0) > a:eq(0)')[0].innerText;
		if($('.btn-follow')[index].className.toLowerCase().indexOf("active") > -1){
			customLog(index + ' - followered - ' +  username, 2);
			index++;
			follwer(sizeLength);
		}else{
			setTimeout(function(){
				$('.btn-follow')[index].click(); 
				totalFollower++;
				customLog(index + ' - follower success - ' +  username, 2);
				index++;
				follwer(sizeLength);
			},SYS_SECOND_TIME * 1000);
		}
	}else{
		loadPage();
	}
}
var end = function(){
	customLog('----- end follower -> '+shopName+' -----');
	customLog('----- summary -----');
	customLog('- Total follower : ' + totalFollower + '/' + (index + 1));
	customLog('- Total has follower : ' + (index - totalFollower) + '/' + (index + 1));
}
var start = function(){
	customLog('----- start follower shop -> '+shopName+' -----');
	customLog('page - ' + pageIndex++, 1);
	follwer(sizeLength);
}

//start 
start();

var shopList = [];
var shopLink = [];
var currentPageItems = 0;
var nextPageItems = "";
var isNotNextPageItems = false;
var getShopsByKeyWord = function(){
	if(document.getElementsByClassName('shopee-search-item-result__items').length > 0){
		var itemLength = document.getElementsByClassName('shopee-item-card--link').length;
		var items = document.getElementsByClassName('shopee-item-card--link');
		for(let i = 0; i < itemLength; i++){
			let href = items[i].href;
			if(href.indexOf('?') > -1){
				href = href.substr(0 , href.indexOf('?'));
			}
			href = href.substr(0 , href.lastIndexOf('.'));
			let shopIdStr = href.substr(href.lastIndexOf('.') + 1 , href.length);
			if(shopList.length == 0 || shopList.indexOf(shopIdStr) == -1){
				shopList.push(shopIdStr);
				shopLink.push('https://shopee.vn/shop/'+shopIdStr+'/followers/?__classic__=1');
			}
		}
	}
	currentPageItems = document.querySelector('.shopee-page-controller > .shopee-button-solid--primary ').innerText;
	nextPageItems = document.querySelector('.shopee-page-controller > .shopee-button-solid--primary + button').innerText;
	if(nextPageItems == ""){
		isNotNextPageItems = true;
	}
}