/* @flow */

import config from '../config'
import VNode, { emptyVNode, cloneVNode, cloneVNodes } from '../vdom/vnode'
import { normalizeChildren } from '../vdom/helpers'
import {
  warn, formatComponentName, bind, isObject, toObject,
  nextTick, resolveAsset, _toString, toNumber, looseEqual, looseIndexOf
} from '../util/index'

import { createElement } from '../vdom/create-element'

export function initRender (vm: Component) {
  vm.$vnode = null // the placeholder node in parent tree
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null
  vm._renderContext = vm.$options._parentVnode && vm.$options._parentVnode.context
  vm.$slots = resolveSlots(vm.$options._renderChildren, vm._renderContext)
  // bind the public createElement fn to this instance
  // so that we get proper render context inside it.
  vm.$createElement = bind(createElement, vm)
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}

export function renderMixin (Blu: Class<Component>) {
  Blu.prototype.$nextTick = function (fn: Function) {
    nextTick(fn, this)
  }

  Blu.prototype._render = function (): VNode {
    const vm: Component = this
    const {
      render,
      staticRenderFns,
      _parentVnode
    } = vm.$options

    if (vm._isMounted) {
      // clone slot nodes on re-renders
      for (const key in vm.$slots) {
        vm.$slots[key] = cloneVNodes(vm.$slots[key])
      }
    }

    if (staticRenderFns && !vm._staticTrees) {
      vm._staticTrees = []
    }
    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        warn(`Error when rendering ${formatComponentName(vm)}:`)
      }
      /* istanbul ignore else */
      if (config.errorHandler) {
        config.errorHandler.call(null, e, vm)
      } else {
        if (config._isServer) {
          throw e
        } else {
          setTimeout(() => { throw e }, 0)
        }
      }
      // return previous vnode to prevent render error causing blank component
      vnode = vm._vnode
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = emptyVNode()
    }
    // set parent
    vnode.parent = _parentVnode
    return vnode
  }

  // shorthands used in render functions
  Blu.prototype._h = createElement
  // toString for mustaches
  Blu.prototype._s = _toString
  // number conversion
  Blu.prototype._n = toNumber
  // empty vnode
  Blu.prototype._e = emptyVNode
  // loose equal
  Blu.prototype._q = looseEqual
  // loose indexOf
  Blu.prototype._i = looseIndexOf

  // render static tree by index
  Blu.prototype._m = function renderStatic (
    index: number,
    isInFor?: boolean
  ): VNode | Array<VNode> {
    let tree = this._staticTrees[index]
    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree by doing a shallow clone.
    if (tree && !isInFor) {
      return Array.isArray(tree)
        ? cloneVNodes(tree)
        : cloneVNode(tree)
    }
    // otherwise, render a fresh tree.
    tree = this._staticTrees[index] = this.$options.staticRenderFns[index].call(this._renderProxy)
    if (Array.isArray(tree)) {
      for (let i = 0; i < tree.length; i++) {
        if (typeof tree[i] !== 'string') {
          tree[i].isStatic = true
          tree[i].key = `__static__${index}_${i}`
        }
      }
    } else {
      tree.isStatic = true
      tree.key = `__static__${index}`
    }
    return tree
  }

  // filter resolution helper
  const identity = _ => _
  Blu.prototype._f = function resolveFilter (id) {
    return resolveAsset(this.$options, 'filters', id, true) || identity
  }

  // render v-for
  Blu.prototype._l = function renderList (
    val: any,
    render: () => VNode
  ): ?Array<VNode> {
    let ret: ?Array<VNode>, i, l, keys, key
    if (Array.isArray(val)) {
      ret = new Array(val.length)
      for (i = 0, l = val.length; i < l; i++) {
        ret[i] = render(val[i], i)
      }
    } else if (typeof val === 'number') {
      ret = new Array(val)
      for (i = 0; i < val; i++) {
        ret[i] = render(i + 1, i)
      }
    } else if (isObject(val)) {
      keys = Object.keys(val)
      ret = new Array(keys.length)
      for (i = 0, l = keys.length; i < l; i++) {
        key = keys[i]
        ret[i] = render(val[key], key, i)
      }
    }
    return ret
  }

  // renderSlot
  Blu.prototype._t = function (
    name: string,
    fallback: ?Array<VNode>
  ): ?Array<VNode> {
    const slotNodes = this.$slots[name]
    // warn duplicate slot usage
    if (slotNodes && process.env.NODE_ENV !== 'production') {
      slotNodes._rendered && warn(
        `Duplicate presence of slot "${name}" found in the same render tree ` +
        `- this will likely cause render errors.`,
        this
      )
      slotNodes._rendered = true
    }
    return slotNodes || fallback
  }

  // apply v-bind object
  Blu.prototype._b = function bindProps (
    data: any,
    value: any,
    asProp?: boolean
  ): VNodeData {
    if (value) {
      if (!isObject(value)) {
        process.env.NODE_ENV !== 'production' && warn(
          'v-bind without argument expects an Object or Array value',
          this
        )
      } else {
        if (Array.isArray(value)) {
          value = toObject(value)
        }
        for (const key in value) {
          if (key === 'class' || key === 'style') {
            data[key] = value[key]
          } else {
            const hash = asProp || config.mustUseProp(key)
              ? data.domProps || (data.domProps = {})
              : data.attrs || (data.attrs = {})
            hash[key] = value[key]
          }
        }
      }
    }
    return data
  }

  // expose v-on keyCodes
  Blu.prototype._k = function getKeyCodes (key: string): any {
    return config.keyCodes[key]
  }
}

export function resolveSlots (
  renderChildren: ?VNodeChildren,
  context: ?Component
): { [key: string]: Array<VNode> } {
  const slots = {}
  if (!renderChildren) {
    return slots
  }
  const children = normalizeChildren(renderChildren) || []
  const defaultSlot = []
  let name, child
  for (let i = 0, l = children.length; i < l; i++) {
    child = children[i]
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    if ((child.context === context || child.functionalContext === context) &&
        child.data && (name = child.data.slot)) {
      const slot = (slots[name] || (slots[name] = []))
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children)
      } else {
        slot.push(child)
      }
    } else {
      defaultSlot.push(child)
    }
  }
  // ignore single whitespace
  if (defaultSlot.length && !(
    defaultSlot.length === 1 &&
    (defaultSlot[0].text === ' ' || defaultSlot[0].isComment)
  )) {
    slots.default = defaultSlot
  }
  return slots
}
