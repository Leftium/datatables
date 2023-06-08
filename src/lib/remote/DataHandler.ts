import Context          from './Context'
import TriggerHandler   from './handlers/TriggerHandler'
import SortHandler      from './handlers/SortHandler'
import SelectHandler    from './handlers/SelectHandler'
import PageHandler      from './handlers/PageHandler'
import SearchHandler    from './handlers/SearchHandler'
import FilterHandler    from './handlers/FilterHandler'

import { type Writable, type Readable, get } from 'svelte/store'
import type { Internationalization, Row, Event, State, Selectable } from '$lib/remote'

export type Params = { rowsPerPage?: number, totalRows?: number, i18n?: Internationalization }

export default class DataHandler<T extends Row = any> 
{
    private context         : Context<T>
    private triggerHandler  : TriggerHandler<T>
    private sortHandler     : SortHandler<T>
    private selectHandler   : SelectHandler<T>
    private pageHandler     : PageHandler<T>
    private searchHandler   : SearchHandler<T>
    private filterHandler   : FilterHandler<T>
    public pageNumber       : Writable<number>
    public i18n             : Internationalization

    constructor(data: T[] = [], params: Params = { rowsPerPage: 5 }) 
    {
        this.context        = new Context(data, params)
        this.triggerHandler = new TriggerHandler(this.context)
        this.sortHandler    = new SortHandler(this.context)
        this.selectHandler  = new SelectHandler(this.context)
        this.pageHandler    = new PageHandler(this.context)
        this.searchHandler  = new SearchHandler(this.context)
        this.filterHandler  = new FilterHandler(this.context)
        this.pageNumber = this.context.pageNumber
        this.i18n = this.translate(params.i18n)
    }

    public setRows(data: T[])
    {
        this.context.rows.set(data)
    }

    public setTotalRows(value: number)
    {
        this.context.totalRows.set(value)
    }

    public getRows(): Writable<T[]> 
    {
        return this.context.rows
    }

    public select(value: Selectable<T>)
    {
        this.selectHandler.select(value)
    }

    public getSelected()
    {
        return this.context.selected
    }

    public selectAll(selectBy: keyof T = null): void
    {
        this.selectHandler.selectAll(selectBy)
    }

    public isAllSelected(): Readable<boolean>
    {
        return this.context.isAllSelected
    }

    public getRowsPerPage(): Writable<number | null>
    {
        return this.context.rowsPerPage
    }

    public setRowsPerPage(): void 
    {
        this.triggerHandler.run('setRowsPerPage')
    }

    public sort(orderBy: keyof T)
    {
        this.setPage(1)
        this.sortHandler.sort(orderBy)
    }

    public applySorting( params: { orderBy:  keyof T, direction?: 'asc' | 'desc' } = null )
    {
        this.sortHandler.applySorting(params)
    }

    public sortAsc(orderBy: keyof T)
    {
        this.setPage(1)
        this.sortHandler.sortAsc(orderBy)
    }

    public sortDesc(orderBy: keyof T)
    {
        this.setPage(1)
        this.sortHandler.sortDesc(orderBy)
    }

    public getSorted(): Writable<{ identifier?: string, direction?: 'asc' | 'desc' }>
    {
        return this.context.sorted
    }

    public search(value: string): void 
    {
        this.context.globalSearch.set(value)
        this.triggerHandler.run('search')
    }

    public clearSearch()
    {
        this.searchHandler.remove()
    }

    public filter(value: string, filterBy: keyof T)
    {
        return this.filterHandler.set(value as string | number, filterBy)
    }

    public clearFilters(): void
    {
        this.filterHandler.remove()
    }

    public getPages(params = { ellipsis: false }): Readable<number[]> 
    {
        if (params.ellipsis) {
            return this.context.pagesWithEllipsis
        }
        return this.context.pages
    }

    public getPageCount(): Readable<number> 
    {
        return this.context.pageCount
    }

    public getPageNumber(): Writable<number> 
    {
        return this.context.pageNumber
    }

    public setPage(value: number | 'previous' | 'next'): void 
    {
        const pageNumber = get(this.pageNumber)

        if (value === 'previous') {
            if (pageNumber === 1) return
            this.pageNumber.set(pageNumber - 1)
        }
        else if (value === 'next') {
            this.pageNumber.set(pageNumber + 1)
        }
        else {
            this.pageNumber.set(value as number)
        }
        this.triggerHandler.run('setPage')
    }

    public getRowCount(): Readable<{ total: number, start: number, end: number }> 
    {
        return this.context.rowCount
    }

    public getTriggerChange(): Writable<number>
    {
        return this.context.triggerChange
    }

    public on(event: Event, fn: Function) 
    {
        this.triggerHandler.setAction(event, fn)
    }

    public getState(): State
    {
        return this.context.getState()
    }

    public translate(i18n: Internationalization): Internationalization 
    {
        return {
            ...{
                search: 'Search...',
                show: 'Show',
                entries: 'entries',
                filter: 'Filter',
                rowCount: 'Showing {start} to {end} of {total} entries',
                noRows: 'No entries found',
                previous: 'Previous',
                next: 'Next'
            },
            ...i18n
        }
    }
}