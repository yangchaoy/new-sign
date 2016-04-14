// 确认状态提示框  setCenter 提交后提示 dataLoading 支付前提示
var common = {

	addCenter: true,
	addLoading: true,
	setCenter: function(con){
		var html = "",
			docHeight = $("body").height(),
			_width = $(window).width(),
			_height = $(window).height();
		html += '<div class="submit-suc">';
		html +=	'	<div class="submit-suc-con">'
		html +=	'		<h2>温馨提示</h2>';
		html +=	'		<abbr>'+con+'</abbr>';
		html += '		<a class="confirm-btn" href="javascript:void(0)">确认</a>';
		html +=	'	</div>';
		html +=	'</div>';
		
		$(".wrap").append(html);
		$(".submit-suc").height(_height);
		var w = $(".submit-suc-con").width(),
			h = $(".submit-suc-con").height(),
			top = (_height-h)/2+"px",
			left = (_width-w)/2+"px";
		$(".submit-suc-con").css({"top":top});
		$(".submit-suc").live("click",function(e){
			// e.preventDefault();
			// ev.stopPropagation();
			$(".submit-suc").remove();
		})
		if(con.length>13){
			$(".submit-suc abbr").css({"padding":"22px 15px 0px","text-align":"left"});
		}
	},
	dataLoading: function(message){
		var html = "",
			docHeight = $("body").height(),
			_width = $(window).width(),
			_height = $(window).height();
		html += '<div class="data-loading">';
		html +=	'	<div class="loading">'
		html +=	'		<span>'+message+'</span>';
		html +=	'	</div>';
		html +=	'</div>';

		$(".wrap").append(html);
		$(".data-loading").height(_height);
		var w = $(".loading").width(),
			h = $(".loading").height(),
			top = (_height-h)/2+"px",
			left = (_width-w)/2+"px";
		$(".loading").css({"top":top,"left":left});
	},
	removeLoading: function(){
		$(".data-loading").remove();
	},
	anyway: function(){
		var docHeight = $("body").height(),
		winHeight = $(window).height();

		if(winHeight<docHeight){
			$(".footer").css({"position":"static"});
		}else {
			$(".footer").css({"position":"absolute","left":"0","bottom":"0px"});
		}
	},
	init: function(){
		common.setCenter();
		common.removeCenter();
	}
}