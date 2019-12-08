//期待用法
// new lvue({
//   data:{msg:hello,vue}
// })

class LVue {
  constructor(options) {
    this.$options = options;
    console.log(options);
    //处理options中的data
    this.$data = options.data;
    //响应化
    this.observe(this.$data);
    //模拟添加依赖
    // new Watcher();
    // this.$data.test;
    // new Watcher();
    // this.$data.foo1.foo2;
    new Compile(options.el, this);

    if (options.created) {
      options.created.call(this);
    }

  }
  observe (data) {
    if (!data || typeof data !== 'object') {
      return;
    } else {
      //遍历data中的数据
      Object.keys(data).forEach(key => {
        //响应化
        this.defineReactive(data, key, data[key]);
        //代理到vm
        this.proxyData(key);
      })
    }
  }
  proxyData (key) {
    Object.defineProperty(this, key, {
      get () {
        return this.$data[key];
      },
      set (newVal) {
        this.$data[key] = newVal;
      }
    })
  }
  defineReactive (obj, key, val) {
    const dep = new Dep();
    Object.defineProperty(obj, key, {
      get () {
        //将watcher添加到dep
        Dep.target && dep.addDep(Dep.target);
        return val;
      },
      set (newVal) {
        if (val !== newVal) {
          val = newVal;
          // console.log(`${key}已更新：${val}`);
          //通知dep
          dep.notify();
        }
      }
    })
    //递归
    this.observe(val);
  }
}

class Dep {
  constructor() {
    this.deps = [];
  }
  addDep (dep) {
    this.deps.push(dep);
  }
  //通知更新
  notify () {
    this.deps.forEach(dep => {
      dep.update()
    })
  }
}

class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;
    //把watcher实例指向静态属性Dep.target
    Dep.target = this;
    //读一下key，添加依赖
    this.vm[this.key];
    Dep.target = null;
  }
  update () {
    // console.log('更新了', Dep.target);
    this.cb.call(this.vm, this.vm[this.key])
  }
}


