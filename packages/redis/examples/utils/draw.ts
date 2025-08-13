import consola from 'consola'
import { colors } from 'consola/utils'

export const line = () => {
    console.log(
        colors.gray(
            '\n___________________________________________________________________________________________\n'
        )
    )
}

export const title = (title: string) => {
    console.log('\n')
    consola.info(colors.bold(colors.underline(colors.cyan(title))))
    console.log('\n')
}

export const isAllowed = (prefix: string, allowed: boolean) => {
    consola.log(`${prefix} ${allowed ? colors.green('ALLOWED') : colors.red('DENIED')}`)
}
