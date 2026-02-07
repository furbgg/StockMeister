# StockMeister Frontend - Testing Guide

## Prerequisites

1. **Backend running**: Make sure the Spring Boot backend is running on `http://localhost:8080`
2. **Database running**: PostgreSQL should be running on port 5433 with the database initialized

## Start the Frontend

```bash
cd frontend
npm run dev
```

The application will open at `http://localhost:5173`

## Test Flow

### 1. Login (Default Credentials)
- Username: `admin`
- Password: `admin123`
- These credentials are displayed on the login page for convenience

### 2. Test Ingredients Page

#### Create Ingredient
- Click "Add Ingredient" button
- Fill in the form:
  - Name: `Milk`
  - Category: `Dairy`
  - Unit: `liter`
  - Current Stock: `10.000`
  - Minimum Stock: `2.000`
  - Unit Price: `1.50`
  - Supplier: `Local Dairy Farm`

#### **BONUS FEATURE - Nutrition Lookup Test** ⭐
1. In the Create Ingredient form, expand the "Nutrition & Allergens (Live Lookup)" accordion
2. The search input should be pre-filled with "Milk"
3. Click "Search Product" button
4. Wait for results from OpenFoodFacts API
5. Review the nutrition cards showing:
   - Product name
   - Brand (if available)
   - Allergens as colored chips
   - Nutrition summary (calories, protein, carbs, fat)
6. Click "Use This Data" button on a result
7. Verify the nutritionInfo field is auto-filled with JSON
8. Save the ingredient
9. Edit the ingredient to see the nutrition data persisted

**Expected Result**: At least one successful nutrition lookup for "Milk" demonstrating the live API integration.

#### View Low Stock
- After creating ingredient, adjust the multiplier (e.g., 1.5x)
- Click "Load Low Stock Items" to see items below threshold

#### Edit & Delete
- Click Edit icon on a row to modify
- Click Delete icon and confirm to remove

### 3. Test Recipes Page

#### Create Recipe
1. Click "Add Recipe" button
2. Fill in basic info:
   - Name: `Cappuccino`
   - Description: `Classic Italian coffee drink`
   - Selling Price: `3.50`
3. Add ingredients using the Autocomplete:
   - Search for "Milk", select it
   - Set amount: `0.150` (150ml)
   - Add another ingredient if you created more
4. Click "Create"

#### View Cost
- Click the dollar sign (€) icon on a recipe row
- View the detailed cost breakdown showing:
  - Total cost
  - Per-ingredient breakdown with unit prices
- Click "View Profit" to see profit analysis

#### View Profit
- Shows 4 cards:
  - Selling Price
  - Total Cost
  - Profit (green if positive, red if negative)
  - Profit Margin %
- Warning alert if recipe is selling at a loss

#### Sell Recipe
1. Click the shopping cart icon
2. Confirm the sale dialog
3. **Expected**: Stock deducted for all ingredients
4. **Expected**: Toast success message
5. Verify in Ingredients page that stock was reduced
6. Try selling when stock is insufficient - should show error

#### Edit & Delete
- Edit: Click three-dot menu → Edit
- Delete: Click three-dot menu → Delete and confirm

### 4. Test Error Handling

#### Network Errors
- Stop the backend server
- Try any operation
- **Expected**: Toast error with backend error message

#### Validation Errors
- Try creating ingredient without name
- Try creating recipe with negative price
- Try creating recipe without ingredients
- **Expected**: Toast validation errors

#### Authentication
- Logout using the navbar button
- Try accessing `/ingredients` directly
- **Expected**: Redirect to login page

### 5. Test Navigation
- Use navbar links to switch between Ingredients and Recipes
- Verify data persists when navigating back and forth

## Key Features Demonstrated

✅ **Basic Auth** - Login with credentials stored in sessionStorage
✅ **Ingredients CRUD** - Full create, read, update, delete operations
✅ **Low Stock Alerts** - Dynamic threshold multiplier
✅ **Recipes CRUD** - Create recipes with multiple ingredients
✅ **Cost Calculation** - Backend-calculated recipe costs
✅ **Profit Analysis** - Margin calculation with visual indicators
✅ **Sell Action** - Atomic stock deduction with 2-phase validation
✅ **Error Handling** - Backend error format properly parsed and displayed
✅ **React Query** - Automatic cache invalidation after mutations
✅ **Material-UI** - Professional DataGrid with actions
⭐ **BONUS: Live Nutrition API** - OpenFoodFacts integration with auto-fill

## Known Limitations (MVP Scope)

- No pagination on backend (using React Query pagination client-side)
- No user registration (only hardcoded admin user)
- No forgot password feature
- No role-based permissions
- CORS configured for localhost only
- Basic Auth instead of JWT (acceptable for Ausbildung demo)

## Troubleshooting

**Issue**: CORS errors
- **Solution**: Verify backend CORS config allows `http://localhost:5173`

**Issue**: Nutrition API not loading
- **Solution**: This is expected sometimes due to CORS. The feature gracefully falls back to manual JSON entry

**Issue**: 401 Unauthorized on all requests
- **Solution**: Clear sessionStorage and login again

**Issue**: Recipe sell fails
- **Solution**: Ensure sufficient stock for ALL ingredients in the recipe
