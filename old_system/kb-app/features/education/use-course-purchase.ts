import { useState, useCallback } from "react";
import Purchases from "react-native-purchases";
import { Alert } from "react-native";

export const useCoursePurchase = (productId: string, productType: string) => {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const entitlementId = `com.intressebevakaren.${productType}.${productId}`;
  const offeringId = `${productType}.${productId}`;

  const checkAccess = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[entitlementId];
      const granted = !!entitlement;
      setHasAccess(granted);
      return granted;
    } catch (error) {
      console.warn("Failed to check entitlement", error);
      return false;
    }
  }, [entitlementId]);

  const purchase = useCallback(async () => {
    try {
      setIsPurchasing(true);
      // User is already logged in to RevenueCat via useRevenueCat hook
      const offerings = await Purchases.getOfferings();

      console.log("Available offerings:", Object.keys(offerings.all));
      console.log("Current offering:", offerings.current?.identifier);

      const offering = offerings.all[offeringId];

      if (!offering || offering.availablePackages.length === 0) {
        Alert.alert("Product not found in offerings");
        return false;
      }

      console.log("availablePackages:", offering.availablePackages);

      const selectedPackage = offering.availablePackages[0];

      console.log("Selected package:", selectedPackage);

      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

      let granted = !!customerInfo.entitlements.active[entitlementId];

      console.log("Entitlement status 1:", granted ? "Granted" : "Not granted");

      if (!granted) {
        // Wait and refresh customer info to allow server sync
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const refreshedInfo = await Purchases.getCustomerInfo();
        granted = !!refreshedInfo.entitlements.active[entitlementId];

        console.log(
          "Entitlement status 2:",
          granted ? "Granted" : "Not granted"
        );
      }

      setHasAccess(granted);

      if (!granted) {
        // Log for debugging
        console.error("Entitlement not found:", {
          expectedId: entitlementId,
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allEntitlements: Object.keys(customerInfo.entitlements.all),
        });
        Alert.alert("Purchase incomplete", "Access not granted.");
      }

      return granted;
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert("Purchase failed", error.message || "Unknown error");
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [entitlementId, offeringId]);

  return {
    isPurchasing,
    hasAccess,
    purchase,
    checkAccess,
  };
};
