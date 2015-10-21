# subscribe

虎牙订阅模块

* 使用方法 
```javascript
subscribe(options)
```

* 使用示例
```javascript
var sub = subscribe({
    aid: 22434399,
    init: function(subed){
        var self = this;    // 这里的this 指向 subscribe实例 sub

        var btn = $('#follow_btn');

        btn.text(subed ? '已订阅' : '订阅')
            .on('click', function(e){
                self.gan()    // ！！！
                e.preventDefault()
            })

        self.change(function(subed){
            btn.text(subed ? '已订阅' : '订阅')
        })
    },
    change: function(subed){    // 跟 上面的 self.change 一样
        alert(subed ? '订阅成功' : '取消订阅成功')
    }
});
```

* 实例化的时候会去查询用户是否订阅了该主播(aid)，并将查询的结果作为实参去调用 init 方法，该方法中的 this 指向实例 sub
* 实例拥有的主要的属性和方法

  * aid

    属性，主播的aid

  * subed

    属性，表示是否订阅了该主播，注意！！！！！因为查询是否订阅了该主播是要发请求异步获取的，所以该属性在 init 完成后才能正常访问，如果你的的逻辑依赖这个属性，那么你可以将逻辑写到 options.init 函数里面  

  * gan

    方法，其内部会根据subed属性值触发 订阅/取消订阅 的行为 (为什么取名gan？本来想用do的，但它是js的关键字 囧~)

  * change

    方法，与 options.change 功能相似，订阅状态发生改变时会触发 调用该方法时传入的回调 ，如
    ```javascript
    // 更新订阅人数
    sub.change(function(subed){
        count.text(subed ? ++total : --total)
    });
    ```

