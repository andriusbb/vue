import Blu from 'blu'

describe('Directive v-model component', () => {
  it('should work', done => {
    const vm = new Blu({
      data: {
        msg: 'hello'
      },
      template: `
        <div>
          <p>{{ msg }}</p>
          <validate v-model="msg">
            <input type="text">
          </validate>
        </div>
      `,
      components: {
        validate: {
          template: '<div><slot></slot></div>',
          props: ['value'],
          methods: {
            onInput (e) {
              // something validate ...
              this.$emit('input', e.target.value)
            }
          },
          mounted () {
            this.$el.addEventListener('input', this.onInput)
          },
          destroyed () {
            this.$el.removeEventListener('input', this.onInput)
          }
        }
      }
    }).$mount()
    document.body.appendChild(vm.$el)
    waitForUpdate(() => {
      expect('v-model is not supported on element type').not.toHaveBeenWarned()
      const input = vm.$el.querySelector('input')
      input.value = 'world'
      triggerEvent(input, 'input')
    }).then(() => {
      expect(vm.msg).toBe('world')
    }).then(() => {
      document.body.removeChild(vm.$el)
      vm.$destroy()
    }).then(done)
  })
})
