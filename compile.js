// new Compile(el,vm)

class Compile {
  constructor(el, vm) {
    this.$el = document.querySelector(el);
    this.$vm = vm;
    if (this.$el) {
      //提取dom元素到fragment碎片，提升dom操作效率
      this.$fragment = this.node2Fragment(this.$el);
      //编译fragment
      this.compile(this.$fragment);
      this.$el.appendChild(this.$fragment);
    }
  }
  node2Fragment (el) {
    const fragment = document.createDocumentFragment();

    while (el.firstChild) {
      fragment.appendChild(el.firstChild);
    }
    return fragment;
  }
  compile (f) {
    const childNodes = f.childNodes;
    //逐个编译
    Array.from(childNodes).forEach(node => {
      //判断节点类型
      // console.log(node);
      if (node.nodeType === 1) {
        //元素节点
        // console.log('编译元素节点' + node.nodeName);
        this.compileElement(node);
      } else if (this.isInterPolation(node)) {
        //插值文本
        // console.log('编译插值文本' + node.textContent);
        this.compileText(node);
      }
      //递归子节点
      if (node.childNodes && node.childNodes.length > 0) {
        this.compile(node);
      }
    })
  }
  isInterPolation (node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }

  compileElement (node) {
    //主要关心元素上的特别的属性
    //<div l-text="test" @click="changeName">
    const nodeAttrs = node.attributes;
    Array.from(nodeAttrs).forEach(attr => {
      const attrName = attr.name;
      const exp = attr.value;
      if (this.isDirective(attrName)) {
        const dir = attrName.substring(2);
        this[dir] && this[dir](node, this.$vm, exp);
      }
      if (this.isEvent(attrName)) {
        const dir = attrName.substring(1);
        this.eventHandler(node, this.$vm, exp, dir);
      }
    })
  }
  isDirective (attr) {
    //判断是否是“l-”开头
    return attr.indexOf('l-') === 0;
  }
  isEvent (attr) {
    //判断是否是“l-”开头
    return attr.indexOf('@') === 0;
  }
  text (node, vm, exp) {
    this.update(node, vm, exp, 'text');
  }
  model (node, vm, exp) {
    //data=>view
    this.update(node, vm, exp, 'model');
    //view=>data
    node.addEventListener('input', e => {
      vm[exp] = e.target.value;
    })
  }
  compileText (node) {
    // console.log(RegExp.$1);
    // console.log(this.$vm);
    // console.log(this.$vm.$data);
    // console.log(this.$vm[RegExp.$1]);

    this.update(node, this.$vm, RegExp.$1, 'text');
  }

  //通用更新函数update，需要判断是什么类型
  update (node, vm, exp, dir) {
    let updatrFn = this[dir + 'UpdatrFn'];

    updatrFn && updatrFn(node, vm[exp]);
    //依赖收集，更新所有用到text的地方

    new Watcher(vm, exp, function (value) {
      updatrFn && updatrFn(node, value);
    })
  }
  //text更新函数,val为更新后的值
  textUpdatrFn (node, val) {
    node.textContent = val;
  }
  modelUpdatrFn (node, val) {
    node.value = val;
  }
  eventHandler (node, vm, exp, dir) {
    const fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm));
    }
  }
}