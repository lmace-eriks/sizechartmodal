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

// Size Chart Class currently used in all Size Chart fields in VTEX's Product Admin.
const sizeChartClass = "vtex-size-chart-content";

// Class of second tier breadcrumb for Size Chart Category. Inner Text contains "Bicycles", "Snowboards", ect.
const categoryClass = "vtex-breadcrumb-1-x-arrow--2";

// List of all pages of "general sizing information" for products.
const sizeChartList = [{ category: "Bicycles", link: "/bike-sizing" }, { category: "Snowboards", link: "/sizing-a-snowboard" }, { category: "Skis", link: "/ski-sizing" }, { category: "Shoes", link: "/cycling-shoes-buying-guide#section-4" }];

const SizeChartModal: StorefrontFunctionComponent<SizeChartModalProps> = ({ }) => {
  const gateOpen = useRef(true);
  const body = useRef<any>();
  const [renderModalControls, setRenderModalControls] = useState(false);
  const [renderLink, setRenderLink] = useState(false);
  const [linkData, setLinkData] = useState<LinkObject>();
  const [modalActive, setModalActive] = useState(false);
  const [modalData, setModalData] = useState("");

  const grabDOM: any = (selector: string) => canUseDOM ? document.querySelector(selector) : null;

  // Component Did Mount.
  useEffect(() => {
    if (!gateOpen.current) return;
    gateOpen.current = false;

    resetPage();
    findChart();
  })

  // Adds and removes Event Listener.
  useEffect(() => {
    if (!canUseDOM) return;
    window.addEventListener("keydown", escapeModal);

    return () => {
      window.removeEventListener("keydown", escapeModal);
    }
  })

  // Reset all state and refs for new data.
  const resetPage = () => {
    if (!canUseDOM) return;
    body.current = document.body;

    setRenderModalControls(false);
    setModalActive(false);
    setRenderLink(false);
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

  // Loops through sizeChartList array and compares productCategory
  // to find a match. If a match is found, we render a link.
  const findLink = () => {
    const categoryDOM = grabDOM(`.${categoryClass}`);
    const productCategory = categoryDOM?.innerText;

    if (!productCategory) return;

    for (let categoryIndex = 0; categoryIndex < sizeChartList.length; categoryIndex++) {
      if (productCategory === sizeChartList[categoryIndex].category) {
        showLink(categoryIndex);
        break;
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

  return renderModalControls ? !modalActive ? <ModalTrigger /> : createPortal(<PopUp />, body.current) : renderLink ? <LinkComponent /> : <></>;
}

SizeChartModal.schema = {
  title: "Size Chart Modal",
  type: "object",
  properties: {}
}

export default SizeChartModal;