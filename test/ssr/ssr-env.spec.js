import Blu from '../../dist/blu.common.js'
import { createRenderer } from '../../packages/blu-server-renderer'
import '../helpers/to-have-been-warned.js'

describe('SSR: VUE_ENV=server', () => {
  it('_isServer set as "server" on Blu config', () => {
    expect(Blu.config._isServer).toBe(true)
  })

  it('$isServer set as true on VM', () => {
    const vm = new Blu({
      data: {
        foo: 'server',
        bar: 'rendering'
      }
    })
    expect(vm.$isServer).toBe(true)
  })

  it('no data observations', () => {
    const vm = new Blu({
      data: {
        foo: 'server',
        bar: 'rendering'
      },
      computed: {
        combined () {
          return this.foo + this.bar
        }
      }
    })

    vm.foo = ''
    expect(vm.foo).toBe('')
    expect(vm.combined).toBe('rendering')
    expect(vm.$data.__ob__).toBe(undefined)
  })

  it('should warn when not set', () => {
    process.env.VUE_ENV = ''
    createRenderer()
    expect('You are using createRenderer without setting VUE_ENV enviroment').toHaveBeenWarned()
    process.env.VUE_ENV = 'server'
  })
})
