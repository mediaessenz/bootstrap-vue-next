<script lang="ts">
import {BvEvent, normalizeSlot, toInteger} from '../../utils'
import {computed, defineComponent, h, type PropType, reactive, watch} from 'vue'
import type {
  AlignmentJustifyContent,
  Booleanish,
  Pagination,
  PaginationPage,
  Size,
} from '../../types'
import {useAlignment, useBooleanish} from '../../composables'
import {useVModel} from '@vueuse/core'
// Default # of buttons limit
const DEFAULT_LIMIT = 5

const DEFAULT_PER_PAGE = 20
const DEFAULT_TOTAL_ROWS = 0

// Threshold of limit size when we start/stop showing ellipsis
const ELLIPSIS_THRESHOLD = 3

// Slot Constants
const SLOT_NAME_ELLIPSIS_TEXT = 'ellipsis-text'
const SLOT_NAME_FIRST_TEXT = 'first-text'
const SLOT_NAME_LAST_TEXT = 'last-text'
const SLOT_NAME_NEXT_TEXT = 'next-text'
const SLOT_NAME_PAGE = 'page'
const SLOT_NAME_PREV_TEXT = 'prev-text'

const sanitizePerPage = (value: number): number => Math.max(toInteger(value) || DEFAULT_PER_PAGE, 1)
const sanitizeTotalRows = (value: number): number =>
  Math.max(toInteger(value) || DEFAULT_TOTAL_ROWS, 0)
const sanitizeCurrentPage = (value: number, numberOfPages: number) => {
  const page = toInteger(value) || 1
  return page > numberOfPages ? numberOfPages : page < 1 ? 1 : page
}

export default defineComponent({
  name: 'BPagination',
  props: {
    align: {type: String as PropType<AlignmentJustifyContent | 'fill'>, default: 'start'},
    ariaControls: {type: String, default: undefined},
    ariaLabel: {type: String, default: 'Pagination'},
    disabled: {type: [Boolean, String] as PropType<Booleanish>, default: false},
    ellipsisClass: {type: [Array, String], default: () => []},
    ellipsisText: {type: String, default: '\u2026'},
    firstClass: {type: [Array, String], default: () => []},
    firstNumber: {type: [Boolean, String] as PropType<Booleanish>, default: false},
    firstText: {type: String, default: '\u00AB'},
    hideEllipsis: {type: [Boolean, String] as PropType<Booleanish>, default: false},
    hideGotoEndButtons: {type: [Boolean, String] as PropType<Booleanish>, default: false},
    labelFirstPage: {type: String, default: 'Go to first page'},
    labelLastPage: {type: String, default: 'Go to last page'},
    labelNextPage: {type: String, default: 'Go to next page'},
    labelPage: {type: String, default: 'Go to page'},
    labelPrevPage: {type: String, default: 'Go to previous page'},
    lastClass: {type: [Array, String], default: () => []},
    lastNumber: {type: [Boolean, String] as PropType<Booleanish>, default: false},
    lastText: {type: String, default: '\u00BB'},
    limit: {type: Number, default: DEFAULT_LIMIT},
    modelValue: {type: Number, default: 1}, // V-model prop
    nextClass: {type: [Array, String], default: () => []},
    nextText: {type: String, default: '\u203A'},
    pageClass: {type: [Array, String], default: () => []},
    perPage: {type: Number, default: DEFAULT_PER_PAGE},
    pills: {type: [Boolean, String] as PropType<Booleanish>, default: false},
    prevClass: {type: [Array, String], default: () => []},
    prevText: {type: String, default: '\u2039'},
    size: {type: String as PropType<Size>, default: 'md'},
    totalRows: {type: Number, default: DEFAULT_TOTAL_ROWS},
  },
  emits: ['update:modelValue', 'page-click'],
  setup(props, {emit, slots}) {
    const modelValue = useVModel(props, 'modelValue', emit)

    const disabledBoolean = useBooleanish(() => props.disabled)
    const firstNumberBoolean = useBooleanish(() => props.firstNumber)
    const hideEllipsisBoolean = useBooleanish(() => props.hideEllipsis)
    const hideGotoEndButtonsBoolean = useBooleanish(() => props.hideGotoEndButtons)
    const lastNumberBoolean = useBooleanish(() => props.lastNumber)
    const pillsBoolean = useBooleanish(() => props.pills)

    const justifyAlign = computed<AlignmentJustifyContent>(() =>
      props.align === 'fill' ? 'start' : props.align
    )
    const alignment = useAlignment(justifyAlign)

    // Use Active to on page-item to denote active tab
    const numberOfPages = computed(() =>
      Math.ceil(sanitizeTotalRows(props.totalRows) / sanitizePerPage(props.perPage))
    )

    const startNumber = computed(() => {
      let lStartNumber: number
      const pagesLeft: number = numberOfPages.value - modelValue.value

      if (pagesLeft + 2 < props.limit && props.limit > ELLIPSIS_THRESHOLD) {
        lStartNumber = numberOfPages.value - numberOfLinks.value + 1
      } else {
        // Middle and beginning calculation.
        lStartNumber = modelValue.value - Math.floor(numberOfLinks.value / 2)
      }
      // Negative due at times
      if (lStartNumber < 1) {
        lStartNumber = 1
      } else if (lStartNumber > numberOfPages.value - numberOfLinks.value) {
        lStartNumber = numberOfPages.value - numberOfLinks.value + 1
      }
      //why check for this?
      // if (showFirstDots.value && cfirstNumber && lStartNumber < 4) {
      //   lStartNumber = 1
      // }

      // Special handling for lower limits (where ellipsis are never shown)
      if (props.limit <= ELLIPSIS_THRESHOLD) {
        if (
          lastNumberBoolean.value &&
          numberOfPages.value === lStartNumber + numberOfLinks.value - 1
        ) {
          lStartNumber = Math.max(lStartNumber - 1, 1)
        }
      }
      return lStartNumber
    })

    const showFirstDots = computed(() => {
      const pagesLeft = numberOfPages.value - modelValue.value
      let rShowDots = false

      if (pagesLeft + 2 < props.limit && props.limit > ELLIPSIS_THRESHOLD) {
        if (props.limit > ELLIPSIS_THRESHOLD) {
          rShowDots = true
        }
      } else {
        if (props.limit > ELLIPSIS_THRESHOLD) {
          rShowDots = !!(!hideEllipsisBoolean.value || firstNumberBoolean.value)
        }
      }
      if (startNumber.value <= 1) {
        rShowDots = false
      }

      if (rShowDots && firstNumberBoolean.value && startNumber.value < 4) {
        rShowDots = false
      }

      return rShowDots
    })

    //Calculate the number of links considering limit
    const numberOfLinks = computed(() => {
      let n: number = props.limit

      if (numberOfPages.value <= props.limit) {
        n = numberOfPages.value
      } else if (modelValue.value < props.limit - 1 && props.limit > ELLIPSIS_THRESHOLD) {
        if (!hideEllipsisBoolean.value || lastNumberBoolean.value) {
          n = props.limit - (firstNumberBoolean.value ? 0 : 1)
        }
        n = Math.min(n, props.limit)
      } else if (
        numberOfPages.value - modelValue.value + 2 < props.limit &&
        props.limit > ELLIPSIS_THRESHOLD
      ) {
        if (!hideEllipsisBoolean.value || firstNumberBoolean.value) {
          n = props.limit - (lastNumberBoolean.value ? 0 : 1)
        }
      } else {
        // We consider ellipsis tabs as their own page links
        if (props.limit > ELLIPSIS_THRESHOLD) {
          n = props.limit - (hideEllipsisBoolean.value ? 0 : 2)
        }
      }

      return n
    })

    const showLastDots = computed(() => {
      const paginationWindowEnd = numberOfPages.value - numberOfLinks.value // The start of the last window of page links

      let rShowDots = false

      if (modelValue.value < props.limit - 1 && props.limit > ELLIPSIS_THRESHOLD) {
        if (!hideEllipsisBoolean.value || lastNumberBoolean.value) {
          rShowDots = true
        }
      } else {
        if (props.limit > ELLIPSIS_THRESHOLD) {
          rShowDots = !!(!hideEllipsisBoolean.value || lastNumberBoolean.value)
        }
      }
      if (startNumber.value > paginationWindowEnd) {
        rShowDots = false
      }
      const lastPageNumber = startNumber.value + numberOfLinks.value - 1

      if (rShowDots && lastNumberBoolean.value && lastPageNumber > numberOfPages.value - 3) {
        rShowDots = false
      }

      return rShowDots
    })

    const pagination = reactive<Pagination>({
      pageSize: sanitizePerPage(props.perPage),
      totalRows: sanitizeTotalRows(props.totalRows),
      numberOfPages: numberOfPages.value,
    })

    const pageClick = (event: MouseEvent, pageNumber: number) => {
      if (pageNumber === modelValue.value) {
        return
      }

      const {target} = event
      // Emit a user-cancelable `page-click` event
      const clickEvent = new BvEvent('page-click', {
        cancelable: true,
        target,
      })
      emit('page-click', clickEvent, pageNumber)
      if (clickEvent.defaultPrevented) {
        return
      }

      modelValue.value = pageNumber

      //    nextTick(() => {
      //  if (isVisible(target) && un_element.contains(target)) {
      //  attemptFocus(target)
      //} else {
      //this.focusCurrent()
      //}
      // })
    }

    const btnSize = computed(() => (props.size ? `pagination-${props.size}` : ''))
    const styleClass = computed(() => (pillsBoolean.value ? 'b-pagination-pills' : ''))

    watch(modelValue, (newValue) => {
      const calculatedValue = sanitizeCurrentPage(newValue, numberOfPages.value)
      if (calculatedValue !== modelValue.value) {
        modelValue.value = calculatedValue
      }
    })

    watch(pagination, (oldValue, newValue) => {
      if (!(oldValue === undefined || oldValue === null)) {
        if (newValue.pageSize !== oldValue.pageSize && newValue.totalRows === oldValue.totalRows) {
          // If the page size changes, reset to page 1
          modelValue.value = 1
        } else if (
          newValue.numberOfPages !== oldValue.numberOfPages &&
          modelValue.value > newValue.numberOfPages
        ) {
          // If `numberOfPages` changes and is less than
          // the `currentPage` number, reset to page 1
          modelValue.value = 1
        }
      }
    })

    //Render Helper Functions
    const pages = computed(() => {
      const result = []
      for (let index = 0; index < numberOfLinks.value; index++) {
        result.push({number: startNumber.value + index, classes: null})
      }
      return result
    })

    return () => {
      const buttons = []
      const pageNumbers = pages.value.map((p) => p.number) // array of numbers... Used in first and last number comparisons
      const isActivePage = (pageNumber: number) => pageNumber === modelValue.value
      const noCurrentPage: boolean = modelValue.value < 1
      const fill = props.align === 'fill'

      const makeEndBtn = (
        linkTo: number,
        ariaLabel: string,
        btnSlot: string,
        btnText: string,
        btnClass: string | unknown[],
        pageTest: number
      ) => {
        const isDisabled: boolean =
          disabledBoolean.value ||
          isActivePage(pageTest) ||
          noCurrentPage ||
          linkTo < 1 ||
          linkTo > numberOfPages.value
        const pageNumber: number =
          linkTo < 1 ? 1 : linkTo > numberOfPages.value ? numberOfPages.value : linkTo
        const scope = {disabled: isDisabled, page: pageNumber, index: pageNumber - 1}
        const btnContent = normalizeSlot(btnSlot, scope, slots) || btnText || ''

        return h(
          'li',
          {
            class: [
              'page-item',
              {
                'disabled': isDisabled,
                'flex-fill': fill,
                'd-flex': fill && !isDisabled,
              },
              btnClass,
            ],
          },
          // render inner content
          h(
            isDisabled ? 'span' : 'button',
            {
              'class': [
                'page-link',
                {'flex-grow-1': !isDisabled && fill},
                {'text-center': isDisabled},
              ],
              'aria-label': ariaLabel,
              'aria-controls': props.ariaControls || null,
              'aria-disabled': isDisabled ? true : null,
              'role': 'menuitem',
              'type': isDisabled ? null : 'button',
              'tabindex': isDisabled ? null : '-1',
              'onClick': (event: MouseEvent) => {
                if (isDisabled) {
                  return
                }
                pageClick(event, pageNumber)
              },
            },
            btnContent
          )
        )
      }

      const makeEllipsis = (isLast: boolean) =>
        h(
          'li',
          {
            class: [
              'page-item',
              'disabled',
              'bv-d-xs-down-none',
              fill ? 'flex-fill' : '',
              props.ellipsisClass,
            ],
            role: 'separator',
            key: `ellipsis-${isLast ? 'last' : 'first'}`,
          },
          [
            h(
              'span',
              {class: ['page-link']},
              normalizeSlot(SLOT_NAME_ELLIPSIS_TEXT, {}, slots) || props.ellipsisText || '...'
            ),
          ]
        )

      const makePageButton = (page: PaginationPage, idx: number) => {
        const active: boolean = isActivePage(page.number) && !noCurrentPage
        const tabIndex = disabledBoolean.value
          ? null
          : active || (noCurrentPage && idx === 0)
          ? '0'
          : '-1'
        const scope = {
          active,
          disabled: disabledBoolean.value,
          page: page.number,
          index: page.number - 1,
          content: page.number,
        }
        const btnContent = normalizeSlot(SLOT_NAME_PAGE, scope, slots) || page.number
        const inner = h(
          disabledBoolean.value ? 'span' : 'button',
          {
            'class': ['page-link', {'flex-grow-1': !disabledBoolean.value && fill}],
            'aria-controls': props.ariaControls || null,
            'aria-disabled': disabledBoolean.value ? true : null,
            'aria-label': props.labelPage ? `${props.labelPage} ${page.number}` : null,
            'role': 'menuitemradio',
            'type': disabledBoolean.value ? null : 'button',
            'tabindex': tabIndex,
            'onClick': (event: MouseEvent) => {
              if (!disabledBoolean.value) {
                pageClick(event, page.number)
              }
            },
          },
          btnContent
        )

        return h(
          'li',
          {
            class: [
              'page-item',
              {
                'disabled': disabledBoolean.value,
                active,
                'flex-fill': fill,
                'd-flex': fill && !disabledBoolean.value,
              },
              props.pageClass,
            ],
            role: 'presentation',
            key: `page-${page.number}`,
          },
          inner
        )
      }

      // Goto first page button. Don't render button when `hideGotoEndButtons` or `firstNumber` is set
      if (!hideGotoEndButtonsBoolean.value && !firstNumberBoolean.value) {
        const gotoFirstPageButton = makeEndBtn(
          1,
          props.labelFirstPage,
          SLOT_NAME_FIRST_TEXT,
          props.firstText,
          props.firstClass,
          1
        )
        buttons.push(gotoFirstPageButton)
      }

      //Previous Button
      const previousButton = makeEndBtn(
        modelValue.value - 1,
        props.labelFirstPage,
        SLOT_NAME_PREV_TEXT,
        props.prevText,
        props.prevClass,
        1
      )
      buttons.push(previousButton)

      // First Page Number Button
      if (firstNumberBoolean.value && pageNumbers[0] !== 1) {
        buttons.push(makePageButton({number: 1}, 0))
      }

      // first Ellipsis
      if (showFirstDots.value) {
        buttons.push(makeEllipsis(false))
      }

      pages.value.forEach((page, idx) => {
        const offset =
          showFirstDots.value && firstNumberBoolean.value && pageNumbers[0] !== 1 ? 1 : 0
        buttons.push(makePageButton(page, idx + offset))
      })

      // last Ellipsis
      if (showLastDots.value) {
        buttons.push(makeEllipsis(true))
      }

      if (lastNumberBoolean.value && pageNumbers[pageNumbers.length - 1] !== numberOfPages.value) {
        buttons.push(makePageButton({number: numberOfPages.value}, -1))
      }

      //Next Button
      const nextButton = makeEndBtn(
        modelValue.value + 1,
        props.labelNextPage,
        SLOT_NAME_NEXT_TEXT,
        props.nextText,
        props.nextClass,
        numberOfPages.value
      )
      buttons.push(nextButton)

      // Goto last page button
      if (!lastNumberBoolean.value && !hideGotoEndButtonsBoolean.value) {
        const gotoLastPageButton = makeEndBtn(
          numberOfPages.value,
          props.labelLastPage,
          SLOT_NAME_LAST_TEXT,
          props.lastText,
          props.lastClass,
          numberOfPages.value
        )
        buttons.push(gotoLastPageButton)
      }

      //pagination
      return h(
        'ul',
        {
          'class': ['pagination', btnSize.value, alignment.value, styleClass.value],
          'role': 'menubar',
          'aria-disabled': disabledBoolean.value,
          'aria-label': props.ariaLabel || null,
        },
        buttons
      )
    }
  },
})
</script>
