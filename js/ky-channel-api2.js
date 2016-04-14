/**
//调用示例
(function(){
    KyChannelApi.start({
        btns: [document.getElementById('download')],
        success: function(result){
            document.getElementById('appsize').innerHTML = '仅'+result.data.appinfo.appsize+'M';
        }
    });
})();
**/

(function(){
    var _ua = navigator.userAgent.toLowerCase(),
        _isIphone = /iphone/gi.test(_ua),
        _isIpad = /ipad/gi.test(_ua),
        _isOther = !(_isIphone || _isIpad),
        _iosVersion = /.+(?!iphone|ipad) .+ os ([\d_]+).+/gi.exec(_ua),
        _isSafari = /safari/g.test(_ua)&&!/(crios|chrome|fxios|qqbrowser|sogou|baidu|ucbrowser|qhbrowser|opera|micromessenger|weibo)/g.test(_ua),
        _channelKey = null,
        _callbackIndex = 0,
        _crcTable,
        _from = location.host + location.pathname,
        _sid, _uid,
        cover = document.getElementById('cover-layer'),
        wechat = document.getElementById('tip-wechat'),

    _iosVersion = _iosVersion&&_iosVersion[1] ? _iosVersion[1].replace(/_/g, '.') : null;

    var STORAGE_ERRATIC_LINK = 'kyapi_storage_erratic_link',
        STORAGE_PERPETUAL_SID = 'kyapi_storage_perpetual_sid',
        STORAGE_PERPETUAL_UID = 'kyapi_storage_perpetual_uid',  //与服务端一致，不能变动
        STORAGE_STEP_TWO = 'kyapi_storage_step_two',
        STORAGE_ERROR_TIMES = 'kyapi_storage_error_times';

    var IMG_SUCCESS = 'data:image/png;base64,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';
    var IMG_LOADING = 'data:image/gif;base64,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';
    var IMG_ERROR = 'data:image/png;base64,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';

    var URL_LOG = 'http://fslog.bppstore.com:7659/report.html';

    var ACTION_LOADED = 'loaded';
    var ACTION_ISPERSONAL = 'ispersonal';
    var ACTION_REQUEST_CONFIG = 'requestconfig';
    var ACTION_RECEIVE_CONFIG = 'receiveconfig';
    var ACTION_CLICK_START = 'clickstart';
    var ACTION_CLICK_CONFIG = 'clickconfig';
    var ACTION_START_BUILD = 'startbuild';
    var ACTION_COMPLETE_BUILD = 'completebuild';
    var ACTION_CLICK_INSTALL = 'clickinstall';
    var ACTION_ERROR_RECEIVECONFIG = 'errorreceiveconfig';
    var ACTION_ERROR_NOBUILDDATA = 'errornobuilddata';
    var ACTION_ERROR_BUILD = 'errorbuild';
    var ACTION_ERROR_GLOBAL = 'errorglobal';


    function getCookie(name){
        var rep = new RegExp(name + '=([^;]*)?', 'i');
        if (rep.test(document.cookie)) {
            return decodeURIComponent(RegExp.$1);
        } else {
            return null;
        }
    };
    function delCookie(name){
        var exp = new Date(0);
        document.cookie = name + '=;expires=' + exp.toUTCString() + ';path=/';
        //document.cookie = name + '=;expires=' + exp.toUTCString() + ';path=/;domain=.kuaiyong.com';
    };
    function setCookie(name, value, hours){
        hours = hours || 24;
        try {
            var exp = new Date();
            exp.setTime(exp.getTime() + hours * 60 * 60 * 1000);
            document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + exp.toUTCString() + ';path=/';
            //document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + exp.toUTCString() + ';path=/;domain=.kuaiyong.com';
            return true;
        } catch (e) {
            return false;
        }
    };

    function log(action){
        return;
        if (!action) {
            return;
        }
        var img = new Image(),
            data = {
                sid: _sid,
                channel: _channelKey,
                from: _from,
                iosversion: _iosVersion,
                issafari: _isSafari,
                action: action,
                rnd: Math.random(),
                test: 1
            };
        if (_uid) {
            data.uid = _uid;
        }
        img.src = addParams(URL_LOG, data);
    }

    function getScript(url, callback){
        var script = document.createElement('script'),
            head = document.querySelector('head');
        script.src = url;
        script.type= 'text/javascript';
        script.charst = 'utf8';
        script.onload = function(evt){
            script.onload = null;
            if (head && head.parentNode) {
                head.removeChild(script);
            }
            script = undefined;
            callback && callback();
        };
        head.appendChild(script);
    }

    function getJSONP(opts){
        opts = opts || {};
        var data = opts.data || {};
        var callbackName = '__kyjsonp__' + ( _callbackIndex++ ) + ('' + Math.random()).replace( /\D/g, '');
        data.callback = callbackName;
        window[callbackName] = function(result){
            /**
            if (opts.data && opts.data.channel == '002') {
                if (result.data && result.data.appinfo) {
                    result.data.appinfo.appversion = '3.5.0.3';
                    result.data.appinfo.plist = 'itms-services://?action=download-manifest&url=https://dinfo.wanmeiyueyu.com/Data/kyco/Aqu/baidu/3.5.0.3_1/kuaiyong.plist';
                    if (parseInt(_iosVersion) === 8) {
                        result.data.appinfo.plist = 'itms-services://?action=download-manifest&url=https://dinfo.wanmeiyueyu.com/Data/kyco/Aqu/baidu/3.5.0.3_1/kuaiyong_ios8.plist';
                    }
                }
                if (result.data) {
                    result.data.appversion = '3.5.0.3';
                    result.data.plistdownloadurl = 'itms-services://?action=download-manifest&url=https://dinfo.wanmeiyueyu.com/Data/kyco/Aqu/baidu/3.5.0.3_1/kuaiyong.plist';
                    if (parseInt(_iosVersion) === 8) {
                        result.data.appinfo.plist = 'itms-services://?action=download-manifest&url=https://dinfo.wanmeiyueyu.com/Data/kyco/Aqu/baidu/3.5.0.3_1/kuaiyong_ios8.plist';
                    }
                }
            }
            **/
            opts.success && opts.success(result);
            delete window[callbackName];
        };
        getScript(addParams(opts.url, data));
    }

    function addParams(url, params){
        var key, arr = [], first = '?';
        for (key in params) {
            arr.push(key + '=' + encodeURIComponent(params[key]));
        }
        if (/\?/g.test(url)) {
            first = '&';
        }
        return url + first + arr.join('&');
    }

    function getChannelKey(){
        var key = /[?&](?:redirect)?fr=([^&]+)/gi.exec(document.location.search);
        key = key&&key[1] ? key[1] : null;
        return key;
    }

    function getSid(){
        var sid = _sid || getCookie(STORAGE_PERPETUAL_SID) || ((+ new Date() + Math.random())*9999).toString(36);
        return sid;
    }

    function getSearchSID(){
        var sid = /[?&]sid=([^&]+)/gi.exec(document.location.search);
        sid = sid&&sid[1] ? sid[1] : null;
        return sid;
    }

    function getSearchUID(){
        var uid = /[?&]kyapi_storage_perpetual_uid=([^&]+)/gi.exec(document.location.search);
        uid = uid&&uid[1] ? decodeURIComponent(uid[1]) : null;
        return uid;
    }

    function getPrimaryLink(){
        var primaryLink = /[?&]primarylink=([^&]+)/gi.exec(document.location.search);
        primaryLink = primaryLink&&primaryLink[1] ? decodeURIComponent(primaryLink[1]) : null;
        return primaryLink;
    }
    //新增获取appid
    function getSearchAppid(){
        var appid = /[?&]appid=([^&]+)/gi.exec(document.location.search);
        appid = appid&&appid[1] ? decodeURIComponent(appid[1]) : '';
        return appid;
    }
    //获取cid 
    function getSearchCid(){
        var channelid = /[?&]cid=([^&]+)/gi.exec(document.location.search);
        channelid = channelid&&channelid[1] ? channelid[1] : null;
        delCookie('channelid');
        setCookie('channelid',channelid,1);
    }
   
    //获取platformid
    function getSearchPid(){
        var platformid = /[?&]pid=([^&]+)/gi.exec(document.location.search);
        platformid = platformid&&platformid[1] ? platformid[1] : null;
        delCookie('platformid');
        setCookie('platformid',platformid,1);
        
    }

    var Annual = {
        URL_GET_IPHONE : 'http://iphonetwo.kuaiyong.com/i/w.php?r=update/htmlUpdate',
        URL_GET_IPAD : 'http://ipadtwo.kuaiyong.com/update/htmlUpdate',

        getKyData: function(opts){
            // getJSONP({
            //     url: opts.url,
            //     data: {
            //         channel: _channelKey
            //     },
            //     success: onSuccess.bind(this)
            // });

            // function onSuccess(result){
            //     if (_isIpad || !_iosVersion){
            //         result = this.compileIPadData(result);
            //     }
            //     if ( !_channelKey ) {
            //         _channelKey = '001';
            //     }
            //     if (/[?&]test/.test(document.location.search)) {
            //         result.data.signtype = 'personal';
            //     }
            //     setCookie(STORAGE_ERRATIC_LINK, result.data.appinfo.plist);
            //     opts.success && opts.success(result);
            // };
        },

        getData: function(opts) {
            opts = opts || {};
            _channelKey = opts.channelKey || getChannelKey();
            var url = _isIphone ? this.URL_GET_IPHONE: this.URL_GET_IPAD,
                onSuccess = opts.success;

            Perpetual.btns = opts.btns;

            //判断是否为第二步页面
            if (getCookie(STORAGE_STEP_TWO)) {    //第二步页面
                delCookie(STORAGE_STEP_TWO);
                
                
                Perpetual.startProgress();

                //开始轮询获取plist日志
                // log(ACTION_START_BUILD);
            } else {

                  //获取channelid 和 platformid 
                //if(location.href.indexOf("redirectfr") == -1){
                    getSearchPid();
                    getSearchCid();
                //}

               // alert(getCookie("channelid"));
                // Array.prototype.forEach.call(opts.btns, function(elem, index){
                //     elem.addEventListener('click', Perpetual.getStartBtnListener(), false);
                // });
                document.getElementById('download').addEventListener("click",function(evt){
                   
                    evt.preventDefault();
                    // log(ACTION_CLICK_START); //打点
                   
                    if(/micromessenger/i.test(_ua)) {
                        evt.preventDefault();
                        document.getElementById('tip-wechat').style.display = 'block';
                        document.getElementById('cover-layer').style.display = 'block';
                        return;
                    }
                    if(/weibo/i.test(_ua)) {
                        evt.preventDefault();
                        document.getElementById('tip-weibo').style.display = 'block';
                        document.getElementById('cover-layer').style.display = 'block';
                        return;
                    }
                    if(parseInt(_iosVersion) < 7 || parseFloat(_iosVersion) >= 9.3){
                        // Perpetual.showUnstart();
                        alert("很抱歉,您的系统暂不支持~");
                        return;
                    }

                    if (_isSafari) {
                        Perpetual.showStartBox();
                    } else {
                        Perpetual.showUnSafariBox();
                    }
                })
                // Array.prototype.forEach.call(opts.btns, function(elem, index){
                //     elem.addEventListener('click', function(evt){
                //        alert(1);
                        
                //        
                //     });
                // });
                //首次进入log
                // log(ACTION_LOADED);
            }
            // opts.url = addParams(url, {systemVersion: _iosVersion});
            // this.getKyData(opts);
        },

        compileIPadData: function(result){
            var resultData = {};
            if (result && result.data){
                resultData.appinfo = {
                    plist: result.data.plistdownloadurl,
                    appsize: (parseInt(result.data.appsize)/(1024 * 1024)).toPrecision(3),
                    appinserttime: result.data.appupdatetime,
                    appversion: result.data.appversion
                };
                resultData.updatemsg = result.data.upgradeinfo;
                resultData.signtype = result.data.signtype;
                result.data = resultData;
            }
            return result;
        }
    };

    //接口地址
    var BASIC_COM_URL = "http://117.121.11.56:8822/"; //测试

    var Perpetual = {
        POLLING_INTERVAL: 3000,
        POLLING_TIMEOUT: 20000,
        //URL_GET_CONFIG: 'http://fsota.kuaiyong.com/front/mobileconf',
        //URL_GET_PLIST: 'http://fsota.kuaiyong.com/front/plist',
        URL_GET_CONFIG: BASIC_COM_URL+'web/mobileconf',
        URL_GET_PLIST: BASIC_COM_URL+'web/plist',
        STYLE_COVER: [
            'background-color:rgba(0,0,0,0.8);',
            'width:100%;',
            'height:100%;',
            'position:fixed;',
            'left:0;',
            'top:0;',
            'z-index:999;'
        ].join(''),
        STYLE_BOX: [
            'background-color:#fff;',
            'width:300px;',
            'height:auto;',
            'margin-left:-150px;',
            'margin-top:-150px;',
            'left:50%;',
            'top:50%;',
            'position:absolute;',
            'border-radius:10px;',
            'text-align:center;',
            'color:#646464;'
        ].join(''),
        pollingStartTime: null,
        startProgress: function(){
            Perpetual.getConfig();
            //是否已经执行
            if(getCookie("hasSuccess") == undefined){
                setCookie('hasSuccess',"success",1);
                this.showProgressBox();
                this.getLink(true);
            }
            else{
                this.showProgressBox();
                this.getLink(true);
            }
            
        },
        createBox: function(html){
            html = html || '';
            var cover = document.createElement('div'),
                box = document.createElement('div');
            cover.setAttribute('style', this.STYLE_COVER);
            box.setAttribute('style', this.STYLE_BOX);
            document.querySelector('body').appendChild(cover);
            cover.appendChild(box);
            box.innerHTML = html;
            return box;
        },
        showUnSafariBox: function(){
            var html = [
                '<div style="padding:40px 0px 0px 0px;">',
                    '<p style="line-height:28px;font-size:16px;color:#000;">仅支持Safari浏览器内安装,<br/>请复制下方链接在safari中打开：</p>',
                    '<p style="padding:15px 0 25px; font-size:14px;"><a href="#" class="kyapi-unsafari-location" style="color:#787878;"></a></p>',
                    '<p class="kyapi-unsafari-close" style="height:50px;line-height:50px;bottom:0;font-size:18px;color:#157efb;border-top:solid 1px #9b9b9b;">',
                        '我知道了',
                    '</p>',
                '</div>'
            ];
            this.unSafariBox = this.createBox(html.join(''));
            this.unSafariBox.querySelector('.kyapi-unsafari-close').addEventListener('click', function(){
                this.hideUnSafariBox();
            }.bind(this));
            this.unSafariBox.querySelector('.kyapi-unsafari-location').innerHTML = location.href;
            this.unSafariBox.querySelector('.kyapi-unsafari-location').setAttribute('href', location.href);
        },
        hideUnSafariBox: function(){
            document.querySelector('body').removeChild(this.unSafariBox.parentNode);
        },
        initStartBox: function(){
            var html = [
                '<div class="kyapi-personal-close" style="position:absolute;width:36px;height:36px;right:3px;top:6px;z-index:100;font-size:24px;">&times;</div>',
                '<div style="padding:40px 8px 32px 8px;">',
                    '<h3 style="height:30px;line-height:30px;padding-bottom:10px;font-family:STHeiti,SimHei;font-size:20px;">',
                        '<img style="display:inline;vertical-align:middle;" src="' + IMG_SUCCESS + '"/>',
                        '<span style="vertical-align:middle;">&nbsp;恭喜！</span>',
                    '</h3>',
                    '<p style="font-size:16px;">您获得了不闪退的体验机会</p>',
                    '<div style="padding:20px 0;">',
                        '<a href="#" target="_blank" class="kyapi-personal-config" style="display:none;width:200px;height:45px;line-height:45px;font-size:18px;color:#fff;background:#fc3c45;">安装体验</a>',
                        '<span class="kyapi-personal-loading" style="text-align:center;">',
                            '<img style="display:inline;" src="' + IMG_LOADING + '" />',
                        '</span>',
                    '</div>',
                    '<p style="font-size:12px;color:#323232;">',
                        '提示：点击安装按钮后，会先安装配置描述文件。',
                    '</p>',
                '</div>'
            ];
            this.startBox = this.createBox(html.join(''));
            this.startBox.parentNode.style.display = 'none';
            this.startBox.querySelector('.kyapi-personal-close').addEventListener('click', function(){
                this.hideStartBox();
            }.bind(this));
            this.startBox.querySelector('a').addEventListener('click', function(evt){
                var url = evt.target.getAttribute('href');
                this.hideStartBox();
                if (/\.mobileconfig$/gi.test(url)) {
                    //进入配置
                    // log(ACTION_CLICK_CONFIG);
                }
            }.bind(this));
        },
        showStartBox: function(){
            this.startBox.parentNode.style.display = 'block';
        },
        hideStartBox: function(){
            this.startBox.parentNode.style.display = 'none';
        },
        showProgressBox: function(){
            var html = [
                '<div class="kyapi-personal-progress" style="padding:40px 8px 32px 8px;">',
                    '<div class="kyapi-personal-loading" style="height:140px;">',
                        '<div style="padding:20px 0;height:30px;">',
                            '<span class="kyapi-loading-number" style="text-align:center;font-size:40px;"></span>',
                        '</div>',
                        '<p style="font-size:16px;height:30px;line-height:30px;padding:10px 0;">',
                            '<img src="' + IMG_LOADING + '" style="display:inline-block;margin-right:8px;vertical-align:text-bottom;height:20px;" />',
                            '<span class="kyapi-loading-txt" style=""></span>',
                        '</p>',
                        '<p style="position:absolute;width:100%;bottom:8px;font-size:12px;color:#323232;">',
                            '提示：请不要关闭此页面。',
                        '</p>',
                    '</div>',
                    '<div class="kyapi-personal-success" style="display:none;height:140px;">',
                        '<div class="kyapi-personal-close" style="position:absolute;width:36px;height:36px;right:3px;top:6px;z-index:100;font-size:24px;">&times;</div>',
                        '<h3 style="height:30px;line-height:40px;padding-bottom:10px;font-family:STHeiti,SimHei;font-size:20px;">',
                            '<img style="display:inline;vertical-align:middle;" src="' + IMG_SUCCESS + '"/>',
                        '</h3>',
                        '<p style="font-size:16px;">文件准备完成</p>',
                        '<div style="padding:20px 0;">',
                            '<a href="#" target="_blank" style="display:inline-block;width:200px;height:45px;line-height:45px;font-size:18px;color:#fff;background:#fc3c45;">立即下载</a>',
                        '</div>',
                    '</div>',
                    '<div class="kyapi-personal-error" style="display:none;min-height:140px;max-height:190px;height:auto;">',
                        '<div class="kyapi-personal-close-fail" style="position:absolute;width:36px;height:36px;right:3px;top:6px;z-index:100;font-size:24px;">&times;</div>',
                        '<h3 style="height:30px;line-height:40px;padding-bottom:10px;font-family:STHeiti,SimHei;font-size:20px;">',
                            '<img style="display:inline;vertical-align:middle;" src="' + IMG_ERROR + '"/>',
                        '</h3>',
                        '<p style="font-size:16px;">呃...服务器卡壳了！</p>',
                        '<div style="padding:20px 0;">',
                            '<a href="#" class="kyapi-btn-retry" target="_blank" style="display:inline-block;width:200px;height:45px;line-height:45px;font-size:18px;color:#fff;background:#fc3c45;">重试</a>',
                            // '<a href="#" class="kyapi-btn-release" target="_blank" style="display:none;width:198px;height:43px;line-height:43px;margin-top:15px;font-size:18px;color:#fc3c45;background:#fff;border:solid 1px #fc3c45;">下载正式版快用</a>',
                        '</div>',
                    '</div>',
                '</div>'
            ];
            this.progressBox = this.createBox(html.join(''));
            var boxSuccess = this.progressBox.querySelector('.kyapi-personal-success'),
                boxError = this.progressBox.querySelector('.kyapi-personal-error');
            boxSuccess.querySelector('.kyapi-personal-close').addEventListener('click', function(){
                boxError.style.display = "none";
                document.querySelector('.kyapi-personal-progress').style.display = 'none';
                this.hideProgressBox();
            }.bind(this));
            boxError.querySelector('.kyapi-personal-close-fail').addEventListener('click', function(){
                boxError.style.display = "none";
                document.querySelector('.kyapi-personal-progress').style.display = 'none';
                this.hideProgressBox();
            }.bind(this));
            if (parseInt(_iosVersion) >= 9) {
                boxSuccess.querySelector('a').addEventListener('click', function(){
                    this.showGuideBox();
                }.bind(this));
            }
        },
        hideProgressBox: function() {
            document.querySelector('body').removeChild(this.progressBox.parentNode);
        },
        showGuideBox: function(){
            var html = [
                '<div class="kyapi-guide-close" style="position:absolute;width:36px;height:36px;right:3px;top:6px;z-index:100;font-size:24px;">&times;</div>',
                '<div style="padding-top:30px;text-align:center;">',
                    '<div style="position:relative;">',
                        '<p style="font-size:16px;">提示“不受信任的开发者”怎么办？</p>',
                        '<img src="http://tg.kuaiyong.com/trust/images/api-guide.png" style="display:block; width:88%;height:auto;margin:0 auto 8px auto;" />',
                        '<p style="width:100%;position:absolute;bottom:-5px;font-size:12px;">注：若安装不成功请关闭此弹框重新下载</p>',
                    '</div>',
                    '<div style="border-top:solid 1px #c3c3c3;line-height:50px;font-size:18px;">',
                        '<a href="http://syxz.7659.com/trust/trust.html" target="_blank" style="display:inline-block;width:50%;height:50px;color:#646464;">解决办法</a>',
                        '<a href="http://syxz.7659.com/trust/trust.mobileconfig" style="display:inline-block;width:49%;height:50px;border-left:solid 1px #c3c3c3;color:#646464;">去信任</a>',
                    '</div>',
                '</div>'
            ];
            this.guideBox = this.createBox(html.join(''));
            this.guideBox.parentNode.style.backgroundColor = 'rgba(0,0,0,0)';
            this.guideBox.querySelector('.kyapi-guide-close').addEventListener('click', function(){
                this.hideGuideBox();
            }.bind(this));
        },
        hideGuideBox: function(){
            document.querySelector('body').removeChild(this.guideBox.parentNode);
        },
        getConfig: function(callback){
            _channelKey = _channelKey || getChannelKey();
            // log(ACTION_REQUEST_CONFIG);
            getSearchPid();
            getSearchCid();

            // alert("channelid"+getCookie("channelid")+"pid"+getCookie("platformid"))
            getJSONP({
                url: this.URL_GET_CONFIG,
                data: {
                    uid: _uid,
                    channel: getCookie("channelid"),
                    platformid: getCookie("platformid"),
                    appid: getSearchAppid(),
                    redirect: location.origin + location.pathname + '?sid=' + _sid + '&primarylink=' + encodeURIComponent(location.href)
                },
                success: function(result){
                    if (parseInt(result.errcode) === 0 && result.data) {
                        // log(ACTION_RECEIVE_CONFIG);
                        callback(result.data.mobileconf);
                    } else {
                        this.startError();
                        // log(ACTION_ERROR_RECEIVECONFIG);
                    }
                }.bind(this)
            });
        },
        getLink: function(first){
            var nodeNumber = this.progressBox.querySelector('.kyapi-loading-number'),
                nodeTxt = this.progressBox.querySelector('.kyapi-loading-txt'),
                estimateDuration = 50*1000,
                percentage = 95,
                durationPercentage = 0;

            if (first) {
                nodeNumber.innerHTML = '0%';
                nodeTxt.innerHTML = '正在检查状态';
                this.pollingStartTime = new Date().getTime();
            }
            getJSONP({
                url: this.URL_GET_PLIST,
                data: {
                    uid: _uid,
                    channel: getCookie("channelid"),
                    platformid: getCookie("platformid"),
                    appid: getSearchAppid(),
                },
                success: function(result){
                    if (parseInt(result.errcode) === 0 && result.data) {
                        switch(parseInt(result.data.status)) {
                            case 0:
                            case 1:
                            case 2:
                            case 3:
                            case 4:
                                durationPercentage = parseInt(percentage*(new Date().getTime()-this.pollingStartTime)/estimateDuration);
                                durationPercentage = durationPercentage > percentage ? percentage : durationPercentage;
                                nodeNumber.innerHTML = durationPercentage + '%';
                                nodeTxt.innerHTML = '正在获取文件';
                                setTimeout(this.getLink.bind(this), this.POLLING_INTERVAL);
                                break;
                            case 5:
                            case 6:
                                nodeNumber.innerHTML = '95%';
                                nodeTxt.innerHTML = '正在生成链接';
                                setTimeout(this.getLink.bind(this), this.POLLING_INTERVAL);
                                break;
                            case 7:
                                delCookie(STORAGE_ERROR_TIMES);
                                this.progressSuccess(result.data.plist);
                                // log(ACTION_COMPLETE_BUILD);
                                break;
                            case 8:
                                this.checkErrorTimes();
                                // alert(result.errmsg);
                                // log(ACTION_ERROR_BUILD);
                                break;
                        }
                    } else {
                        this.checkErrorTimes();
                        // log(ACTION_ERROR_NOBUILDDATA);
                    }
                }.bind(this)
            });
        },
        checkErrorTimes: function(){
            var errorTimes = parseInt(getCookie(STORAGE_ERROR_TIMES)) || 0;
            errorTimes++;
            setCookie(STORAGE_ERROR_TIMES, errorTimes);
            if (errorTimes >= 2) {
                this.progressError(true);
            } else {
                this.progressError();
            }
        },
        getStartBtnListener: (function(){
            var startFunc;
            return function(){
                
                startFunc = startFunc || function(evt){

                    evt.preventDefault();
                    if(/micromessenger/i.test(_ua)) {
                        evt.preventDefault();
                        document.getElementById('tip-wechat').style.display = 'block';
                        document.getElementById('cover-layer').style.display = 'block';
                        return;
                    }
                    if(/weibo/i.test(_ua)) {
                        evt.preventDefault();
                        document.getElementById('tip-weibo').style.display = 'block';
                        document.getElementById('cover-layer').style.display = 'block';
                        return;
                    }
                    if(parseInt(_iosVersion) < 7 || parseFloat(_iosVersion) >= 9.3){
                        // Perpetual.showUnstart();
                        alert("很抱歉,您的系统暂不支持~");
                        return;
                    }

                    if (_isSafari) {
                        Perpetual.showStartBox();
                    } else {
                        Perpetual.showUnSafariBox();
                    }
                };
                return startFunc;
            }
        })(),
        addConfigLinkListener: (function(){
            var restartFunc = null;
            return function(configLink, node) {
                restartFunc = restartFunc || function(evt) {
                    evt && evt.preventDefault();
                    Perpetual.startProgress();
                };
                if (/\.mobileconfig$/gi.test(configLink)) {
                    node.setAttribute('href', configLink);
                } else {
                    node.removeEventListener('click', Perpetual.getStartBtnListener(), false);
                    node.removeEventListener('click', restartFunc, false);
                    node.addEventListener('click', restartFunc, false);
                }
            }
        })(),
        progressSuccess: function(link){
            var boxSuccess = this.progressBox.querySelector('.kyapi-personal-success'),
                btnLink = boxSuccess.querySelector('a');
            this.progressBox.querySelector('.kyapi-personal-loading').style.display = 'none';
            boxSuccess.style.display = 'block';
            btnLink.setAttribute('href', link);
            btnLink.removeEventListener('click', this.addClickInstallLog, false);
            btnLink.addEventListener('click', this.addClickInstallLog, false);
            Array.prototype.forEach.call(this.btns, function(elem, index){
                elem.setAttribute('href', link);
                elem.removeEventListener('click', this.getStartBtnListener(), false);
                elem.removeEventListener('click', this.addClickInstallLog, false);
                elem.addEventListener('click', this.addClickInstallLog, false);
            }.bind(this));
        },
        startError: function(){
            Perpetual.getConfig(function(configLink){
                this.showStartSuccess(configLink);
            }.bind(this));
        },
        progressError: function(twice){
            twice = !!twice;
            Perpetual.getConfig(function(configLink){
                this.showProgressError(configLink, twice);
            }.bind(this));
            Array.prototype.forEach.call(this.btns, function(elem, index){
                elem.setAttribute('href', getCookie(STORAGE_ERRATIC_LINK));
            });
        },
        showStartSuccess: function(configLink){
            var btn = this.startBox.querySelector('.kyapi-personal-config');
            this.addConfigLinkListener(configLink, btn);
            this.startBox.querySelector('.kyapi-personal-loading').style.display = 'none';
            btn.style.display = 'inline-block';
        },
        showProgressError: function(configLink, twice){
            var boxError = this.progressBox.querySelector('.kyapi-personal-error'),
                btnRetry = boxError.querySelector('a:nth-child(1)'),
                btnRelease = boxError.querySelector('a:nth-child(2)');
            this.progressBox.querySelector('.kyapi-personal-loading').style.display = 'none';
            boxError.style.display = 'block';
            this.addConfigLinkListener(configLink, btnRetry);
            if(twice) {
                btnRelease.setAttribute('href', getCookie(STORAGE_ERRATIC_LINK));
                btnRelease.style.display = 'inline-block';
            }
        },
        addClickInstallLog: function(){
            // log(ACTION_CLICK_INSTALL);
        }
    };

    window.KyChannelApi = window.KyChannelApi || {};
    window.KyChannelApi.getData = function(opts){
        Annual.getData(opts);
    };
    window.KyChannelApi.start = function(opts){
        opts = opts || {};
        if (!opts.btns || opts.btns.length === 0){
            return;
        }
        Annual.getData({
            channelKey: opts.channelKey || getChannelKey(),
            btns: opts.btns,
            success: function(result){
                opts.success && opts.success(result);
            }
        });
    };

    function main(){

        window.addEventListener('error', function(evt){
            // log(ACTION_ERROR_GLOBAL);
        });

        var primaryLink = getPrimaryLink(),
            searchSID = getSearchSID(),
            searchUID = getSearchUID();
        if (primaryLink && searchSID && searchUID) {
            setCookie(STORAGE_PERPETUAL_SID, searchSID, 24*365);
            setCookie(STORAGE_PERPETUAL_UID, searchUID, 24*365);
            setCookie(STORAGE_STEP_TWO, 1);
            document.location.href = primaryLink;
        } else {
            _sid = getSid();
            _uid = getCookie(STORAGE_PERPETUAL_UID) || '';
            setCookie(STORAGE_PERPETUAL_SID, _sid, 24*365);
            if (!getCookie(STORAGE_STEP_TWO)) {
                Perpetual.initStartBox();
                Perpetual.getConfig(function(configLink){
                    Perpetual.showStartSuccess(configLink);
                });
            }
        }
    }

    main();

})();
