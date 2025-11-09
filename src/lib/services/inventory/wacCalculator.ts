import { CostEntry } from '../products/types';

/**
 * Weighted Average Cost Calculator
 * Core algorithm for calculating weighted average cost when new inventory is received
 */
export class WACCalculator {
  /**
   * Calculate new weighted average cost when adding inventory
   * @param currentStock Current units in stock
   * @param currentWAC Current weighted average cost per unit
   * @param newQuantity New units being added
   * @param newUnitCost Cost per unit of new inventory
   * @returns Updated WAC calculation result
   */
  static calculateNewWAC(
    currentStock: number,
    currentWAC: number,
    newQuantity: number,
    newUnitCost: number
  ): {
    newWeightedAverageCost: number;
    newTotalUnits: number;
    newTotalValue: number;
  } {
    // Handle edge cases
    if (currentStock < 0 || newQuantity <= 0) {
      throw new Error('Invalid stock quantities for WAC calculation');
    }

    // If no current stock, the new WAC is just the new unit cost
    if (currentStock === 0) {
      return {
        newWeightedAverageCost: newUnitCost,
        newTotalUnits: newQuantity,
        newTotalValue: newQuantity * newUnitCost
      };
    }

    // Calculate current total value
    const currentTotalValue = currentStock * currentWAC;
    
    // Calculate new inventory value
    const newInventoryValue = newQuantity * newUnitCost;
    
    // Calculate combined totals
    const newTotalUnits = currentStock + newQuantity;
    const newTotalValue = currentTotalValue + newInventoryValue;
    
    // Calculate new weighted average cost
    const newWeightedAverageCost = newTotalValue / newTotalUnits;

    return {
      newWeightedAverageCost: Math.round(newWeightedAverageCost * 100) / 100, // Round to 2 decimal places
      newTotalUnits,
      newTotalValue: Math.round(newTotalValue * 100) / 100
    };
  }

  /**
   * Calculate cost of goods sold using WAC
   * @param quantitySold Units being sold
   * @param currentWAC Current weighted average cost per unit
   * @returns COGS calculation
   */
  static calculateCOGS(quantitySold: number, currentWAC: number): number {
    if (quantitySold <= 0 || currentWAC < 0) {
      throw new Error('Invalid parameters for COGS calculation');
    }

    return Math.round(quantitySold * currentWAC * 100) / 100;
  }

  /**
   * Create a cost entry for tracking purposes
   * @param quantity Quantity purchased
   * @param unitCost Unit cost of purchase
   * @param newWAC New weighted average cost after this purchase
   * @param supplierId Optional supplier ID
   * @param invoiceReference Optional invoice reference
   * @returns Cost entry object
   */
  static createCostEntry(
    quantity: number,
    unitCost: number,
    newWAC: number,
    supplierId?: string,
    invoiceReference?: string
  ): CostEntry {
    return {
      date: new Date(),
      quantity,
      unitCost: Math.round(unitCost * 100) / 100,
      totalCost: Math.round(quantity * unitCost * 100) / 100,
      runningAverage: Math.round(newWAC * 100) / 100,
      supplierId,
      invoiceReference
    };
  }

  /**
   * Calculate recommended selling price based on WAC and desired margin
   * @param weightedAverageCost Current WAC
   * @param marginPercentage Desired profit margin (e.g., 40 for 40%)
   * @returns Recommended selling price
   */
  static calculateRecommendedPrice(
    weightedAverageCost: number,
    marginPercentage: number = 40
  ): number {
    if (weightedAverageCost <= 0 || marginPercentage < 0) {
      throw new Error('Invalid parameters for price calculation');
    }

    const markup = 1 + (marginPercentage / 100);
    return Math.round(weightedAverageCost * markup * 100) / 100;
  }

  /**
   * Calculate actual profit margin based on selling price and WAC
   * @param sellingPrice Current selling price
   * @param weightedAverageCost Current WAC
   * @returns Profit margin percentage
   */
  static calculateMarginPercentage(
    sellingPrice: number,
    weightedAverageCost: number
  ): number {
    if (sellingPrice <= 0 || weightedAverageCost <= 0) {
      return 0;
    }

    const profit = sellingPrice - weightedAverageCost;
    const marginPercentage = (profit / sellingPrice) * 100;
    
    return Math.round(marginPercentage * 100) / 100;
  }

  /**
   * Determine if a sale would be profitable
   * @param sellingPrice Proposed selling price
   * @param weightedAverageCost Current WAC
   * @param minimumMargin Minimum acceptable margin percentage
   * @returns Whether sale is profitable
   */
  static isProfitable(
    sellingPrice: number,
    weightedAverageCost: number,
    minimumMargin: number = 0
  ): boolean {
    const actualMargin = this.calculateMarginPercentage(sellingPrice, weightedAverageCost);
    return actualMargin >= minimumMargin;
  }
}