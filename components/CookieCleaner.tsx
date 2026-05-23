"use client";

import { useEffect } from "react";

const COOKIES_TO_CLEAN = [
  "user_token",
  "old_session",
  "auth_token",
  "session_id",
];

const COOKIE_VERSION = "v2";
const VERSION_KEY = "lhub_cookie_version";

export function CookieCleaner() {
  useEffect(() => {

    const currentVersion = localStorage.getItem(VERSION_KEY);
    
    if (currentVersion !== COOKIE_VERSION) {
      console.log("[CookieCleaner] Limpando cookies antigos...");
      

      COOKIES_TO_CLEAN.forEach(cookieName => {

        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        

        const domain = window.location.hostname;
        const parts = domain.split('.');
        if (parts.length > 1) {
          const rootDomain = parts.slice(-2).join('.');
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain};`;
        }
      });
      

      const keysToRemove = [
        "old_user_data",
        "legacy_session",
        "cached_user",
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {

        }
      });
      

      localStorage.setItem(VERSION_KEY, COOKIE_VERSION);
      
      console.log("[CookieCleaner] Cookies antigos removidos com sucesso!");
      

      const hasValidSession = document.cookie.includes("user_session=");
      const isProtectedPage = window.location.pathname.startsWith("/dashboard");
      
      if (isProtectedPage && !hasValidSession) {
        console.log("[CookieCleaner] Sessão inválida detectada, redirecionando para login...");
        window.location.href = "/login";
      }
    }
  }, []);

  return null;
}

export function forceCleanAllCookies() {
  const cookies = document.cookie.split(";");
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
  

  localStorage.clear();
  

  window.location.href = "/login";
}
