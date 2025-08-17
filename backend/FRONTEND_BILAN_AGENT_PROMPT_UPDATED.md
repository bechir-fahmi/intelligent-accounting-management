# Frontend Bilan Generation Agent Prompt - Updated

## ⚠️ IMPORTANT: Number Formatting Issue Resolution

### Problem Identified
The external bilan API returns numbers with comma separators (e.g., "7,735") which represent thousands separators, not decimals. When these are processed, they can be misinterpreted.

**Example Issue:**
- External API returns: `"resultat_avant_impot": "7,735"` (European decimal notation)
- This means: **7.735 Tunisian Dinars** (7 dinars and 735 millimes)
- NOT: 7,735 Dinars (seven thousand seven hundred thirty-five)
- The comma is a **decimal separator**, not a thousands separator!

**Another Example:**
- External API returns: `"montant": 23365` (integer in millimes)
- This means: **23.365 Tunisian Dinars** (23 dinars and 365 millimes)
- Should display as: "23,365 DT" (using comma as decimal separator)

### Backend Solution Implemented
The backend now includes a `processBilanNumbers()` method that:
1. **Detects European decimal notation** (comma as decimal separator)
2. **Converts to standard decimal format** ("7,735" becomes 7.735)
3. **Preserves the actual monetary value** in dinars
4. **Handles both string and integer formats** from the external API
5. **Logs conversions** for debugging

### Frontend Implementation Requirements

#### 1. Number Display Formatting
You MUST implement proper number formatting for financial values:

```javascript
// Utility function for formatting Tunisian Dinar amounts
// The backend sends decimal values (7.735, 23.365, etc.) representing dinars
const formatTunisianDinar = (value, decimals = 3) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0,000 DT';
  }
  
  // Use French locale for Tunisian number formatting (comma as decimal separator)
  const formatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true
  });
  
  const formatted = formatter.format(Math.abs(value));
  const sign = value < 0 ? '-' : '';
  
  return `${sign}${formatted} DT`;
};

// Examples of correct formatting:
// formatTunisianDinar(7.735) → "7,735 DT" (7 dinars and 735 millimes)
// formatTunisianDinar(23.365) → "23,365 DT" (23 dinars and 365 millimes)
// formatTunisianDinar(280.250) → "280,250 DT" (280 dinars and 250 millimes)
// formatTunisianDinar(-32.666) → "-32,666 DT" (negative 32 dinars and 666 millimes)

// For amounts that should show fewer decimals (like totals)
const formatTunisianDinarShort = (value, decimals = 2) => {
  return formatTunisianDinar(value, decimals);
};

// Examples:
// formatTunisianDinarShort(7.735) → "7,74 DT" (rounded to 2 decimals)
// formatTunisianDinarShort(23.365) → "23,37 DT" (rounded to 2 decimals)

// For whole dinars only (no millimes)
const formatTunisianDinarWhole = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0 DT';
  }
  
  const formatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true
  });
  
  const formatted = formatter.format(Math.abs(Math.round(value)));
  const sign = value < 0 ? '-' : '';
  
  return `${sign}${formatted} DT`;
};

// Examples:
// formatTunisianDinarWhole(7.735) → "8 DT" (rounded up)
// formatTunisianDinarWhole(23.365) → "23 DT" (rounded down)
```

#### 2. Financial Report Display Standards

##### Balance Sheet (Bilan Comptable)
```jsx
// Example React component for displaying financial values
const FinancialValue = ({ label, value, isNegative = false }) => {
  const formattedValue = formatTunisianDinar(value);
  
  return (
    <div className={`financial-row ${isNegative ? 'negative' : ''}`}>
      <span className="label">{label}</span>
      <span className={`value ${value < 0 ? 'text-red-600' : 'text-gray-900'}`}>
        {formattedValue}
      </span>
    </div>
  );
};

// Usage in Balance Sheet
<div className="balance-sheet">
  <h3>Actif Courant</h3>
  <FinancialValue 
    label="Stocks et en-cours" 
    value={bilanData.bilan_comptable.actif.actif_courant.stocks_et_en_cours} 
  />
  <FinancialValue 
    label="Clients et comptes rattachés" 
    value={bilanData.bilan_comptable.actif.actif_courant.clients_et_comptes_rattaches} 
  />
  <FinancialValue 
    label="Disponibilités" 
    value={bilanData.bilan_comptable.actif.actif_courant.disponibilites} 
  />
  <FinancialValue 
    label="Total Actif Courant" 
    value={bilanData.bilan_comptable.actif.actif_courant.total_actif_courant} 
  />
</div>
```

##### Income Statement (Compte de Résultat)
```jsx
const IncomeStatement = ({ compteResultat }) => {
  return (
    <div className="income-statement">
      <h3>Compte de Résultat</h3>
      
      {/* Revenue Section */}
      <div className="revenue-section">
        <h4>Produits d'Exploitation</h4>
        <FinancialValue 
          label="Chiffre d'affaires" 
          value={compteResultat.produits_exploitation.chiffre_affaires} 
        />
        <FinancialValue 
          label="Total Produits d'Exploitation" 
          value={compteResultat.produits_exploitation.total_produits_exploitation} 
        />
      </div>
      
      {/* Expenses Section */}
      <div className="expenses-section">
        <h4>Charges d'Exploitation</h4>
        <FinancialValue 
          label="Achats consommés" 
          value={compteResultat.charges_exploitation.achats_consommes} 
        />
        <FinancialValue 
          label="Charges personnel" 
          value={compteResultat.charges_exploitation.charges_personnel} 
        />
        <FinancialValue 
          label="Total Charges d'Exploitation" 
          value={compteResultat.charges_exploitation.total_charges_exploitation} 
        />
      </div>
      
      {/* Results Section */}
      <div className="results-section">
        <FinancialValue 
          label="Résultat d'Exploitation" 
          value={compteResultat.resultat_exploitation}
          isNegative={compteResultat.resultat_exploitation < 0}
        />
        <FinancialValue 
          label="Résultat avant Impôt" 
          value={compteResultat.resultat_avant_impot}
          isNegative={compteResultat.resultat_avant_impot < 0}
        />
        <FinancialValue 
          label="Résultat Net" 
          value={compteResultat.resultat_net}
          isNegative={compteResultat.resultat_net < 0}
        />
      </div>
    </div>
  );
};
```

#### 3. Data Validation
Always validate the received data:

```javascript
const validateBilanData = (bilanData) => {
  const errors = [];
  
  // Check if main sections exist
  if (!bilanData.bilan_comptable) {
    errors.push('Missing balance sheet data');
  }
  
  if (!bilanData.compte_de_resultat) {
    errors.push('Missing income statement data');
  }
  
  // Validate numeric values
  const validateNumeric = (value, fieldName) => {
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push(`Invalid numeric value for ${fieldName}: ${value}`);
    }
  };
  
  // Validate key financial figures
  if (bilanData.compte_de_resultat) {
    validateNumeric(bilanData.compte_de_resultat.resultat_net, 'Résultat Net');
    validateNumeric(bilanData.compte_de_resultat.resultat_avant_impot, 'Résultat avant Impôt');
    validateNumeric(bilanData.compte_de_resultat.resultat_exploitation, 'Résultat d\'Exploitation');
  }
  
  if (bilanData.bilan_comptable) {
    validateNumeric(bilanData.bilan_comptable.total_actif, 'Total Actif');
    validateNumeric(bilanData.bilan_comptable.total_passif, 'Total Passif');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

#### 4. Error Handling for Number Issues
```javascript
const handleBilanResponse = async (response) => {
  try {
    const bilanData = await response.json();
    
    // Validate the data
    const validation = validateBilanData(bilanData);
    if (!validation.isValid) {
      console.error('Bilan data validation failed:', validation.errors);
      throw new Error('Invalid bilan data received from server');
    }
    
    // Log key values for debugging
    console.log('📊 Bilan Data Received:');
    console.log('Résultat Net:', formatTunisianDinar(bilanData.compte_de_resultat.resultat_net));
    console.log('Total Actif:', formatTunisianDinar(bilanData.bilan_comptable.total_actif));
    console.log('Total Passif:', formatTunisianDinar(bilanData.bilan_comptable.total_passif));
    
    return bilanData;
  } catch (error) {
    console.error('Error processing bilan response:', error);
    throw error;
  }
};
```

#### 5. CSS Styling for Financial Values
```css
.financial-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.financial-row.negative .value {
  color: #dc2626;
  font-weight: 600;
}

.financial-row .label {
  font-weight: 500;
  color: #374151;
}

.financial-row .value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  text-align: right;
  min-width: 120px;
}

.total-row {
  border-top: 2px solid #374151;
  border-bottom: 3px double #374151;
  font-weight: 700;
  background-color: #f9fafb;
}

.negative-result {
  background-color: #fef2f2;
  color: #dc2626;
}

.positive-result {
  background-color: #f0fdf4;
  color: #059669;
}
```

#### 6. Testing the Number Formatting
Create test cases to ensure proper formatting:

```javascript
// Test cases for number formatting
const testCases = [
  { input: 7.735, expected: "7,735 DT" },
  { input: 23.365, expected: "23,365 DT" },
  { input: 280.250, expected: "280,250 DT" },
  { input: -32.666, expected: "-32,666 DT" },
  { input: 0, expected: "0,000 DT" },
  { input: 1.500, expected: "1,500 DT" },
  { input: 102.948, expected: "102,948 DT" }
];

testCases.forEach(({ input, expected }) => {
  const result = formatTunisianDinar(input);
  console.assert(result === expected, `Expected ${expected}, got ${result} for input ${input}`);
});

// Test cases for short format (2 decimals)
const shortFormatTests = [
  { input: 7.735, expected: "7,74 DT" },
  { input: 23.365, expected: "23,37 DT" },
  { input: 280.250, expected: "280,25 DT" }
];

shortFormatTests.forEach(({ input, expected }) => {
  const result = formatTunisianDinarShort(input);
  console.assert(result === expected, `Expected ${expected}, got ${result} for input ${input}`);
});
```

### Summary of Changes

1. **Backend**: Added `processBilanNumbers()` method to handle comma-separated numbers
2. **Frontend**: Must implement proper Tunisian Dinar formatting
3. **Display**: Use spaces as thousands separators (French/Tunisian standard)
4. **Validation**: Always validate numeric values before display
5. **Styling**: Proper CSS for financial reports with negative value highlighting

### Key Points to Remember

- **"7,735" in API response = 7.735 numeric value = "7,735 DT" display**
- **23365 millimes = 23.365 dinars = "23,365 DT" display**
- **Use comma as decimal separator** (European/Tunisian standard)
- **Always use proper Tunisian Dinar formatting**
- **Validate all numeric values before display**
- **Handle negative values with appropriate styling**
- **Use monospace fonts for financial figures alignment**

### Currency Conversion Reference
- **1 Dinar = 1000 Millimes**
- **API may return values in millimes (integers) or dinars (decimals)**
- **Always display in dinars with 3 decimal places for precision**
- **Use comma as decimal separator**: 7.735 → "7,735 DT"

This ensures that financial values are displayed correctly and consistently throughout the application, maintaining the integrity of the Tunisian financial data while providing a professional presentation.