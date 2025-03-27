import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Enhanced useMediaQuery that accepts a media query string
export function useMediaQuery(query?: string) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)
  
  React.useEffect(() => {
    // If no query is provided, default to mobile breakpoint
    const mediaQuery = query || `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    
    const mql = window.matchMedia(mediaQuery)
    const onChange = () => {
      setMatches(mql.matches)
    }
    
    mql.addEventListener("change", onChange)
    setMatches(mql.matches)
    
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return !!matches
}
