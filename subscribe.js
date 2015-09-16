(function(exports){

    var yyuid = getCookie('yyuid');
    var anchorList = [];    // 用户订阅的主播

    // 查询是否订阅了该主播
    var check = (function(){
            var callbacks = $.Callbacks();
            var isReady = false;

            if ( !yyuid ) {
                isReady = true;
            } 
            else {
                // 获取用户订阅列表
                $.ajax({
                    url: 'http://fw.huya.com/dispatch?do=subscribe&uid=' + yyuid,
                    type: 'GET',
                    dataType: 'JSONP',
                    cache: false
                })
                .done(function(res){
                    if (res.status === 1000) {
                        if (res.result && res.result.list && res.result.list.length) {
                            $.each(res.result.list, function(i, o){
                                o && (typeof o.activityId !== 'undefined') && anchorList.push(o.activityId)
                            })
                        }
                    } else {
                        log('获取用户订阅列表失败：' + (res.message || res.status))
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

            function ck (aid) {
                for (var i = 0, l = anchorList.length; i < l; i++) {
                    if (aid == anchorList[i]) {
                        return true
                    }
                }

                return false
            }

            return function (aid, fn) {
                if (isReady) {
                    setTimeout(callback, 0)
                } else {
                    callbacks.add(callback)
                }

                function callback () {
                    typeof fn === 'function' && fn( ck(aid) )
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

            check(options.aid, function(subed){
                options.init.call(instance, subed)
                instance.changeCallbacks.add(options.change);
            });

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
                anchorList.push(aid)
            } else {
                $.each(anchorList, function(i, id){
                    if (aid == id) {
                        anchorList.splice(i, 1);
                        return false    // break
                    } 
                })                
            }
        });

        // init
        check(aid, function(subed){
            self.subed = subed;
            options.init.call(self, subed);
            self.changeCallbacks.add(options.change);
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
