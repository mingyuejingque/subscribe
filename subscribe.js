/**
 * 虎牙订阅模块
 * https://github.com/huya-fed/subscribe
 */
(function(exports){

    var yyuid = getCookie('yyuid');
    var subList = [];    // 用户的订阅列表

    // 查询是否订阅了该主播
    var check = (function(){
            var callbacks = $.Callbacks();
            var isReady = false;

            if ( !yyuid ) {
                isReady = true;
            } 
            else {
                // 获取用户的订阅列表
                $.ajax({
                    url: 'http://api.huya.com/subscribe/getSubscribeToListEx?from_type=1&from_key=' + yyuid,
                    type: 'GET',
                    dataType: 'JSONP',
                    cache: false
                })
                .done(function(data){
                    if (data.result === 0) {
                        if (data.list && data.list.length) {
                            subList = data.list
                        }
                    } else {
                        log('获取用户订阅列表失败：' + data.result)
                    }
                })
                .fail(function(xhr, code) {
                    log('获取用户订阅列表失败：' + code)
                })
                .always(function(){
                    isReady = true;
                    callbacks.fire()
                })
            }

            function ck (type, id) {
                var o;

                for (var i = 0, l = subList.length; i < l; i++) {
                    o = subList[i] || {};

                    if (type === 0) {
                        if (o.aid == id) return true
                    } else {
                        if (o.type === type && o.key == id) return true
                    }
                }

                return false
            }

            return function (options) {
                if ( !$.isPlainObject(options) ) return;

                var type = options.type    // 订阅的目标的类型
                var id = options.id    // 订阅的目标的id
                var callback = typeof options.callback === 'function' ? options.callback : function () {}    // 处理查询结果的回调

                if (isReady) {
                    setTimeout(fn, 0)
                } else {
                    callbacks.add(fn)
                }

                function fn () {
                    callback( ck(type, id) )
                }
            }
    })();

    var instanceCache = {};

    function subscribe (options) {
        if ( !(this instanceof subscribe) ) {
            return new subscribe(options)
        }

        // 确保对于同一个aid只有一个实例
        var instance = instanceCache[options.aid];

        if (instance) {
            check({
                type: 0,
                id: options.aid,
                callback: function (subed) {
                    options.init.call(instance, subed)
                    instance.changeCallbacks.add(options.change);                    
                }
            })

            return instance
        } 
        else {
            instanceCache[options.aid] = this
        }

        var self = this;
        var aid = self.aid = options.aid;

        self.changeCallbacks = $.Callbacks();

        // 更新订阅列表
        self.changeCallbacks.add(function(subed){
            if (subed) {
                subList.push({
                    type: 0,
                    aid: aid
                })
            } else {
                $.each(subList, function(i, o){
                    if (aid == o.aid) {
                        subList.splice(i, 1);
                        return false    // break
                    } 
                })                
            }
        });

        // init
        check({
            type: 0,
            id: aid,
            callback: function (subed) {            
                self.subed = subed;
                options.init.call(self, subed);
                self.changeCallbacks.add(options.change);
            }
        })
    }

    subscribe.prototype = {
        gan: function () {
            // 初始化完成才能gan
            if ( !('subed' in this) ) {
                return 
            } 

            // 需要登录
            if (!yyuid)  {
                login()
                return
            }

            var self = this;
            var subed = self.subed;
            var aid = self.aid;

            $.ajax({
                url: 'http://www.huya.com/member/index.php?m=Activity&do=jsonpSub&from=act&aid='+ aid +'&type='+ (subed ? 'Cancel' : 'Subscribe'),
                type: 'GET',
                dataType: 'JSONP',
                cache: false
            })
            .done(function(res){

                if (subed) {
                    if (res.status == 3) {
                        self.subed = false;
                        self.changeCallbacks.fireWith(self, [false]);
                    } else {
                        alert('取消订阅失败：'+ res.status +' '+ res.message)
                    }
                } 
                else {
                    if (res.status == 1) {
                        self.subed = true;
                        self.changeCallbacks.fireWith(self, [true]);
                    } else {
                        alert('订阅失败：'+ res.status +' '+ res.message)
                    }
                }
            })
            .fail(function(xhr, code){
                alert((subed ? '取消订阅失败：' : '订阅失败：') + code)
            })
        },
        change: function (callback) {
            this.changeCallbacks.add(callback)
        }
    };

    // helper
    function getCookie (key) {
        var cookie  = document.cookie ? document.cookie.split('; ') : [],
            cookies = {},
            parts = null;

        for (var i = 0, l = cookie.length; i < l; i++) {
            parts = cookie[i].split('=');
            cookies[ decodeURIComponent(parts[0]) ] = decodeURIComponent(parts[1]);
        }

        return cookies[key]
    }

    function login () {
        try {
            NAV_UTIL.login()
        } catch (e) {
            log('依赖的登录组件没有引入！')
        }
    }

    function log (s) {
        window.console && window.console.log && window.console.log(s)
    }

    exports.subscribe = subscribe
})(window);
