import Blu from 'blu'

describe('Options parent', () => {
  it('should work', () => {
    const parent = new Blu({}).$mount()

    const child = new Blu({
      parent: parent
    }).$mount()

    // this option is straight-forward
    // it should register 'parent' as a $parent for 'child'
    // and push 'child' to $children array on 'parent'
    expect(child.$options.parent).toBeDefined()
    expect(child.$options.parent).toEqual(parent)
    expect(child.$parent).toBeDefined()
    expect(child.$parent).toEqual(parent)
    expect(parent.$children).toContain(child)

    // destroy 'child' and check if it was removed from 'parent' $children
    child.$destroy()
    expect(parent.$children.length).toEqual(0)
    parent.$destroy()
  })
})
