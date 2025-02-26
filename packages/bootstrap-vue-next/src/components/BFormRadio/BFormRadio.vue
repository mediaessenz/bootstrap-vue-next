<template>
  <RenderComponentOrSkip :skip="isButtonGroup" :class="computedClasses">
    <input
      :id="computedId"
      v-bind="$attrs"
      ref="input"
      v-model="localValue"
      :checked="localValue"
      :class="inputClasses"
      type="radio"
      :disabled="disabledBoolean || parentData?.disabled.value"
      :required="computedRequired || undefined"
      :name="name || parentData?.name.value"
      :form="form || parentData?.form.value"
      :aria-label="ariaLabel"
      :aria-labelledby="ariaLabelledby"
      :value="value"
      :aria-required="computedRequired || undefined"
    />
    <label v-if="hasDefaultSlot || plainBoolean === false" :for="computedId" :class="labelClasses">
      <slot />
    </label>
  </RenderComponentOrSkip>
</template>

<script setup lang="ts">
import {useFocus, useVModel} from '@vueuse/core'
import {computed, inject, nextTick, ref, useSlots, watch} from 'vue'
import {getClasses, getInputClasses, getLabelClasses, useBooleanish, useId} from '../../composables'
import type {Booleanish, ButtonVariant, Size} from '../../types'
import {isEmptySlot, radioGroupKey} from '../../utils'
import RenderComponentOrSkip from '../RenderComponentOrSkip.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    ariaLabel?: string
    ariaLabelledby?: string
    form?: string
    id?: string
    name?: string
    size?: Size
    autofocus?: Booleanish
    modelValue?: boolean | string | unknown[] | Record<string, unknown> | number | null
    plain?: Booleanish
    button?: Booleanish
    buttonGroup?: Booleanish
    disabled?: Booleanish
    buttonVariant?: ButtonVariant | null
    inline?: Booleanish
    required?: Booleanish
    state?: Booleanish | null
    value?: string | boolean | Record<string, unknown> | number
  }>(),
  {
    ariaLabel: undefined,
    ariaLabelledby: undefined,
    form: undefined,
    id: undefined,
    name: undefined,
    autofocus: false,
    plain: false,
    button: false,
    buttonGroup: false,
    disabled: false,
    modelValue: undefined,
    state: null,
    size: undefined,
    buttonVariant: null,
    inline: false,
    required: false,
    value: true,
  }
)

const emit = defineEmits<{
  'input': [value: boolean | string | unknown[] | Record<string, unknown> | number | null]
  'change': [value: boolean | string | unknown[] | Record<string, unknown> | number | null]
  'update:modelValue': [
    value: boolean | string | unknown[] | Record<string, unknown> | number | null,
  ]
}>()

defineSlots<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: (props: Record<string, never>) => any
}>()

const slots = useSlots()

const modelValue = useVModel(props, 'modelValue', emit, {passive: true})

const computedId = useId(() => props.id, 'form-check')

const autofocusBoolean = useBooleanish(() => props.autofocus)
const plainBoolean = useBooleanish(() => props.plain)
const buttonBoolean = useBooleanish(() => props.button)
const buttonGroupBoolean = useBooleanish(() => props.buttonGroup)
const disabledBoolean = useBooleanish(() => props.disabled)
const inlineBoolean = useBooleanish(() => props.inline)
const requiredBoolean = useBooleanish(() => props.required)
const stateBoolean = useBooleanish(() => props.state)

const parentData = inject(radioGroupKey, null)

const input = ref<HTMLElement | null>(null)

const {focused} = useFocus(input, {
  initialValue: autofocusBoolean.value,
})

const hasDefaultSlot = computed(() => !isEmptySlot(slots.default))

const localValue = computed({
  get: () =>
    parentData !== null
      ? JSON.stringify(parentData.modelValue.value) === JSON.stringify(props.value)
      : JSON.stringify(modelValue.value) === JSON.stringify(props.value),
  set: (newValue: string | boolean | unknown[] | Record<string, unknown> | number | null) => {
    const updateValue =
      newValue ||
      newValue === '' ||
      newValue === 0 ||
      JSON.stringify(newValue) === JSON.stringify(props.value)
        ? props.value
        : false

    emit('input', updateValue)
    modelValue.value = updateValue
    nextTick(() => {
      emit('change', updateValue)
    })
    if (parentData !== null) parentData.set(props.value)
  },
})

watch(modelValue, (newValue) => {
  if (parentData === null || newValue === false) return
  parentData.set(props.value)
})

const computedRequired = computed(
  () =>
    !!(props.name ?? parentData?.name.value) &&
    (requiredBoolean.value || parentData?.required.value)
)

const isButtonGroup = computed(
  () => buttonGroupBoolean.value || (parentData?.buttons.value ?? false)
)

const classesObject = computed(() => ({
  plain: plainBoolean.value || (parentData?.plain.value ?? false),
  button: buttonBoolean.value || (parentData?.buttons.value ?? false),
  inline: inlineBoolean.value || (parentData?.inline.value ?? false),
  state: stateBoolean.value || parentData?.state.value,
  size: props.size !== undefined ? props.size : parentData?.size.value ?? 'md', // This is where the true default is made
  buttonVariant:
    props.buttonVariant !== null
      ? props.buttonVariant
      : parentData?.buttonVariant.value ?? 'secondary', // This is where the true default is made
}))
const computedClasses = getClasses(classesObject)
const inputClasses = getInputClasses(classesObject)
const labelClasses = getLabelClasses(classesObject)

defineExpose({
  focus: () => {
    focused.value = true
  },
  blur: () => {
    focused.value = false
  },
  input,
})
</script>
