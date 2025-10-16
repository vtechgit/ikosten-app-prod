# Language Initialization Fix for Mobile Apps

## Problem Description

When launching the mobile app (Android/iOS via Capacitor), users were seeing error toast messages:
- "Solicitud inválida" (Invalid request)
- "Recurso no encontrado" (Resource not found)

Despite these errors, data would load correctly after a few seconds.

### Root Cause

Android Studio logs revealed:
```
Unable to open asset URL: https://localhost/i18n/undefined.json
ERROR [object Object] (repeated 12+ times at line 100470)
```

**The Issue:**
1. ngx-translate attempted to load translation files immediately when initialized
2. Language detection (Device.getLanguageCode()) is asynchronous
3. Between initialization and language detection, the language was `undefined`
4. ngx-translate tried to load `./i18n/undefined.json` from Capacitor assets
5. Error interceptor caught these 404 errors and displayed toast notifications
6. Eventually device language was detected and translations loaded successfully

## Solution Implemented

### 1. Synchronous Language Initialization (app.component.ts)

**Changes:**
- Set default language to 'es' (Spanish) immediately - more appropriate for the target market
- Check localStorage for stored language **before** any async operations
- Use Device.getLanguageCode() with proper async/await and error handling
- Validate language values to prevent 'undefined' or empty strings
- Make API call to load languages **non-blocking** (doesn't affect initial load)

**Code Structure:**
```typescript
constructor() {
  // Moved all language initialization to separate method
  this.initializeLanguage();
}

private async initializeLanguage() {
  var languageToUse = 'es'; // Default immediately
  this.translate.setDefaultLang('es'); // Set before any async operations
  
  // Check stored language first (synchronous)
  const storedLang = localStorage.getItem('lang');
  if (storedLang && storedLang !== '' && storedLang !== null && storedLang !== 'undefined') {
    languageToUse = storedLang;
    this.translate.use(languageToUse);
  } else {
    // Get device language with proper error handling
    try {
      const deviceLang = await Device.getLanguageCode();
      if (deviceLang && deviceLang.value && deviceLang.value !== 'undefined') {
        languageToUse = deviceLang.value;
      }
    } catch (error) {
      console.warn('Could not get device language, using default');
    }
    
    this.translate.use(languageToUse);
    localStorage.setItem('lang', languageToUse);
  }
  
  // Load available languages (non-blocking)
  this.api.read('languages').subscribe(...)
}
```

### 2. Translation Error Suppression (error.interceptor.ts)

**Changes:**
- Added filter to ignore HTTP errors from translation file loading (`/i18n/*.json`)
- Added filter to ignore HTTP errors from countries/languages API during initialization
- Only applies to requests matching the patterns
- Logs warning instead of showing toast
- Allows components to handle errors with fallback logic

**Code:**
```typescript
intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
  return next.handle(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ignore translation file loading errors
      if (request.url.includes('/i18n/') && request.url.endsWith('.json')) {
        console.warn('Translation file not found (normal during initialization):', request.url);
        return throwError(() => error);
      }

      // Ignore countries/languages initialization errors
      if (request.url.includes('/countries/') || request.url.includes('/languages')) {
        console.warn('Error loading countries/languages (fallback will be used):', request.url);
        return throwError(() => error);
      }
      
      // Continue with normal error handling for API errors
      // ...
    })
  );
}
```

### 3. Improved Initialization Flow (main.page.ts)

**Changes:**
- Moved `loadCurrencies()` call from `ngOnInit()` to after language initialization
- Added logic to only load currencies once in `ionViewWillEnter()`
- Added explicit error handling with fallback to Spanish
- Improved logging for debugging

**ngOnInit() Flow:**
```typescript
ngOnInit() {
  // 1. Load user session
  if (this.api.isLoggedIn()) {
    this.userSession = this.api.getUserData();
  }

  // 2. Initialize language
  this.initializeLanguage();
  
  // 3. Load data (currencies will load later with getLanguages())
  this.setDateLocale();
  this.loadUserReceipts();
}
```

**loadCurrencies() with Error Handling:**
```typescript
loadCurrencies() {
  const lang = this.selectedLanguage || this.translate.currentLang || 
               this.translate.defaultLang || 'es';
  
  this.api.read('countries/' + lang).subscribe({
    next: (res) => {
      if (res['status'] == 200) {
        this.currencies = res['body'];
        console.log('✅ Currencies loaded');
      }
    },
    error: (error) => {
      console.error('❌ Error loading currencies:', error);
      // Fallback to Spanish if language fails
      if (lang !== 'es') {
        this.api.read('countries/es').subscribe({
          next: (res) => {
            if (res['status'] == 200) {
              this.currencies = res['body'];
              console.log('✅ Currencies loaded with fallback');
            }
          }
        });
      }
    }
  });
}
```

### 4. Process Page Updates (process.page.ts)

**Changes:**
- Applied same error handling pattern to `getCurrencies()` and `loadCurrencies()`
- Added fallback to Spanish language
- Added detailed logging for debugging
- Prevents toast notifications for initialization errors

## Benefits

1. **No More Error Toasts**: Users won't see "invalid request" or "resource not found" on app startup
2. **Faster Initialization**: Language is set synchronously from localStorage or device settings
3. **Better Error Handling**: Translation and initialization errors are logged but don't interrupt user experience
4. **Graceful Fallback**: If device language can't be detected or API fails, app uses Spanish default
5. **Validation**: All language values checked to prevent undefined/empty strings
6. **Retry Logic**: If loading currencies fails, automatically retries with Spanish fallback
7. **Cleaner Logs**: Console shows clear success/error messages for debugging
8. **No Duplicate Calls**: Optimized to prevent multiple simultaneous API calls

## Related Files

- `src/app/app.component.ts` - Language initialization logic
- `src/app/interceptors/error.interceptor.ts` - Translation & initialization error suppression
- `src/app/pages/main/main.page.ts` - Main page initialization with error handling
- `src/app/pages/process/process.page.ts` - Process page with error handling
- `back-end/src/modules/countries/countries.routes.js` - Backend validation

## Console Logs

**Before Fix:**
```
Unable to open asset URL: https://localhost/i18n/undefined.json
ERROR [object Object] (x12)
❌ Error loading countries
❌ Toasts appear on startup
✅ Data eventually loads
```

**After Fix:**
```
🌍 Using stored language: es
✅ Language initialized: es es-ES
✅ User session loaded
✅ Country selected
✅ Receipts loaded
```

## Additional Improvements

Consider these future enhancements:
1. Preload translation files for offline use
2. Implement translation caching strategy
3. Add loading indicator during initial data fetch
4. Lazy load non-critical translations
5. Optimize translation file sizes
