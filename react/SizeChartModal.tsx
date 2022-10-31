import React, { useEffect, useRef, useState } from "react";
//@ts-expect-error
import { createPortal } from "react-dom";
import { canUseDOM } from "vtex.render-runtime";

import styles from "./styles.css";

interface SizeChartModalProps { }
interface LinkObject {
  category: string
  link: string
}

// Where to place trigger button
const targetTriggerContainerClass = "vtex-store-components-3-x-skuSelectorSubcontainer--size";

// Size Chart Class currently used in all Size Chart fields in VTEX's Product Admin.
const sizeChartClass = "vtex-size-chart-content";

// List of all pages of "general sizing information" for products.
const sizeChartList = [{ category: "Bicycles", link: "/bike-sizing" }, { category: "Snowboards", link: "/sizing-a-snowboard" }, { category: "Skis", link: "/ski-sizing" }, { category: "Shoes", link: "/cycling-shoes-buying-guide#section-4" }];

const SizeChartModal: StorefrontFunctionComponent<SizeChartModalProps> = ({ }) => {
  const timerGateOpen = useRef(true);
  const productCategories = useRef<any>();
  const body = useRef<any>();
  const targetTriggerContainer = useRef<any>();
  const device = useRef("");
  const [renderModalControls, setRenderModalControls] = useState(false);
  const [renderLink, setRenderLink] = useState(false);
  const [linkData, setLinkData] = useState<LinkObject>();
  const [modalActive, setModalActive] = useState(false);
  const [modalData, setModalData] = useState("");

  const grabDOM = (selector: string) => canUseDOM ? document.querySelector(selector) : null;

  // Adds and removes Event Listeners.
  useEffect(() => {
    if (!canUseDOM) return;
    window.addEventListener("message", handleMessage);
    window.addEventListener("keydown", escapeModal);
    window.addEventListener("resize", resizeWindow);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("keydown", escapeModal);
      window.removeEventListener("resize", resizeWindow);
    }
  })

  // Throttle operations to once per 2 seconds.
  const resizeWindow = () => {
    if (!timerGateOpen.current) return;
    timerGateOpen.current = false;

    setTimeout(() => {
      if (!canUseDOM) return;
      const innerWidth = window.innerWidth;

      const desktopToMobile = device.current === "desktop" && innerWidth <= 1025;
      const mobileToDesktop = device.current === "mobile" && innerWidth >= 1026;

      if (desktopToMobile || mobileToDesktop) resetPage();

      timerGateOpen.current = true;
    }, 2000)
  }

  // Listens for messages from VTEX.
  const handleMessage = (e: any) => {
    const eventName = e.data.eventName;

    if (eventName === "vtex:pageView") {
      setRenderModalControls(false);
      setModalActive(false);
    }

    if (eventName === "vtex:productView") {
      productCategories.current = e.data.product.categoryTree;
      resetPage();
    }
  }

  // Reset all state and refs for new data.
  const resetPage = () => {
    if (!canUseDOM) return;
    body.current = document.body;
    device.current = window.innerWidth >= 1026 ? "desktop" : "mobile";

    setRenderModalControls(false);
    setModalActive(false);
    setRenderLink(false);

    // Timeout for slowing down state management and for letting VTEX update their DOM.
    setTimeout(() => {
      targetTriggerContainer.current = grabDOM(`.${targetTriggerContainerClass}`);
      findChart();
    }, 250);
  }

  // Size Chart container <div> is loaded in below the breadcrumbs and hidden with CSS.
  // findChart() checks to see if it exists, and copies the innerHTML to <PopUp /> inside
  // of a React Portal. Portal is neccesary due to other elements on the PDP having a 
  // higher stacking context and z-index is not sufficient, so placing the modal later
  // in the DOM fixes the issue - LM
  const findChart = () => {
    const sizeChartDiv = grabDOM(`.${sizeChartClass}`);

    // If no chart was found, look for general page link.
    if (!sizeChartDiv) {
      setRenderModalControls(false);
      findLink();
      return;
    }

    const sizeChartContent = sizeChartDiv.innerHTML;

    setModalData(sizeChartContent);
    setRenderModalControls(true);
  }

  // Loops through sizeChartList array and compares productCategories.current
  // to find a match. If a match is found, we render a link.
  const findLink = () => {
    let breakParentLoop = false;

    for (let sizeChartIndex = 0; sizeChartIndex < sizeChartList.length; sizeChartIndex++) {
      if (breakParentLoop) break;
      const category = sizeChartList[sizeChartIndex].category;

      for (let productCatIndex = 0; productCatIndex < productCategories.current.length; productCatIndex++) {
        const categoryName = productCategories.current[productCatIndex].name;
        // If a general page exists for the current product category, show link and break loops.
        if (categoryName === category) {
          showLink(sizeChartIndex);
          breakParentLoop = true;
          break;
        }
      }
    }
  }

  // Builds general sizing link data and sets to render.
  const showLink = (sizeChartIndex: number) => {
    const tempLinkData: LinkObject = {
      category: sizeChartList[sizeChartIndex].category,
      link: sizeChartList[sizeChartIndex].link
    }
    setLinkData(tempLinkData);
    setRenderLink(true);
  }

  const openModal = () => setModalActive(true);

  const closeModal = () => setModalActive(false);

  // Close modal with escape key.
  const escapeModal = (e: any) => {
    if (!modalActive) return;
    if (e.keyCode === 27) closeModal();
  }

  const ModalTrigger = () => (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button onClick={openModal} className={styles.sizeButton}>Size Information</button>
      </div>
    </div>
  )

  const PopUp = () => (
    <div onClick={closeModal} className={styles.overlay}>
      <button onClick={closeModal} className={styles.closeButton}>X</button>
      <div className={styles.modalContainer}>
        <div className={styles.modalWrapper} dangerouslySetInnerHTML={{ __html: modalData }} />
      </div>
    </div>
  )

  const LinkComponent = () => (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <a href={linkData?.link} target="_blank" rel="noreferrer" className={styles.sizeButton}>How to Size {linkData?.category}</a>
      </div>
    </div>
  )

  // Portals are necessary due to smaller screens loading the desktop version first, then
  // re-rendering the mobile version. This wipes out and reloads the app AFTER the "vtex:productView"
  // has fired so we lose the information. To fix this we place this app outside of the context of the 
  // re-rendering blocks and attach a "page resize" listener to call the app to look for assets again. - LM
  return renderModalControls ? !modalActive ? createPortal(<ModalTrigger />, targetTriggerContainer.current) : createPortal(<PopUp />, body.current) : renderLink ? createPortal(<LinkComponent />, targetTriggerContainer.current) : <></>;
}

SizeChartModal.schema = {
  title: "Size Chart Modal",
  type: "object",
  properties: {}
}

export default SizeChartModal;