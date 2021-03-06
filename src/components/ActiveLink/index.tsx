import Link, { LinkProps } from "next/link"
import { useRouter } from "next/router"
import { cloneElement, ReactElement } from "react"

interface IActiveLinkProps extends LinkProps{
  children: ReactElement,
  activeClassName: string,
}

export function ActiveLink({ children, activeClassName, ...rest }: IActiveLinkProps) {
  const { asPath } = useRouter()
  const className = asPath === rest.href ? activeClassName : '';

  return (
    <Link href={rest.href}>
      {cloneElement(children, {
        className
      })}
    </Link>
  )
}