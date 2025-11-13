/**
 * Defensive wrapper for window.getComputedStyle
 * Prevents "Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'" errors
 *
 * This fix handles cases where libraries (like jsPDF or Bootstrap) might call getComputedStyle
 * on null, undefined, or non-Element values.
 */
(function() {
  'use strict';

  // Store the original getComputedStyle function
  const originalGetComputedStyle = window.getComputedStyle;

  // Override with a safer version
  window.getComputedStyle = function(element, pseudoElement) {
    // Check if element is null, undefined, or not an Element
    if (!element || !(element instanceof Element)) {
      console.warn('getComputedStyle called with invalid element:', element);

      // Return a mock CSSStyleDeclaration object to prevent errors
      // This creates a Proxy that returns empty strings for any property access
      return new Proxy({}, {
        get: function(target, prop) {
          if (prop === 'getPropertyValue') {
            return function() { return ''; };
          }
          if (prop === 'length') {
            return 0;
          }
          return '';
        }
      });
    }

    // If element is valid, call the original function
    return originalGetComputedStyle.call(this, element, pseudoElement);
  };

  console.log('[Fix] getComputedStyle defensive wrapper loaded successfully');
})();
