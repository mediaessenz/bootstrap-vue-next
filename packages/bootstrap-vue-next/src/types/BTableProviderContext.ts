import type {Booleanish} from './Booleanish'

export type BTableProviderContext = {
  readonly filter?: string | object
  readonly currentPage?: number
  readonly perPage?: number
  readonly sortBy?: string
  readonly sortDesc?: Booleanish
}
