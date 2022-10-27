import React, { useEffect, useMemo, useRef, useState } from "react";
//@ts-expect-error
import { createPortal } from "react-dom";
import { canUseDOM } from "vtex.render-runtime";

import styles from "./styles.css";

interface SizeChartModalProps { }
interface LinkObject {
  category: string
  link: string
}

const sizeChartClass = "vtex-size-chart-content";
const sizeChartList = [{ category: "Bicycles", link: "/bike-sizing" }, { category: "Snowboards", link: "/sizing-a-snowboard" }, { category: "Skis", link: "/ski-sizing" }, { category: "Shoes", link: "/cycling-shoes-buying-guide#section-4" }];

const SizeChartModal: StorefrontFunctionComponent<SizeChartModalProps> = ({ }) => {
  const [renderModalControls, setRenderModalControls] = useState(false);
  const [renderLink, setRenderLink] = useState(false);
  const [linkData, setLinkData] = useState<LinkObject>();
  const [modalActive, setModalActive] = useState(false);
  const [modalData, setModalData] = useState("");
  const productCategories = useRef<any>();
  const body = useRef<any>();

  useEffect(() => {
    if (!canUseDOM) return;
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  })

  // Listens for messages from VTEX for a PDP page view - LM
  const handleMessage = (e: any) => {
    const eventName = e.data.eventName;
    if (!eventName) return;
    console.info(e);

    if (eventName === "vtex:productView") {
      const productTree = e.data.product.categoryTree;
      resetPage(productTree);
    }
  }

  const resetPage = (productTree: any) => {
    if (!canUseDOM) return;
    productCategories.current = productTree;
    body.current = document.body;

    setRenderModalControls(false);
    setModalActive(false);
    setRenderLink(false);
    setTimeout(() => { findChart() }, 1);
  }

  const findChart = () => {
    if (!canUseDOM) return;
    const sizeChartDiv = document.getElementsByClassName(sizeChartClass)[0];

    // If no chart, check if a general page exists for sizing - LM
    if (!sizeChartDiv) {
      findLink();
      return;
    }

    const sizeChartContent = sizeChartDiv.innerHTML;

    setModalData(sizeChartContent);
    setRenderModalControls(true);
  }

  const findLink = () => {
    setRenderModalControls(false);

    for (let i = 0; i < sizeChartList.length; i++) {
      const category = sizeChartList[i].category;

      for (let j = 0; j < productCategories.current.length; j++) {
        const categoryName = productCategories.current[j].name;
        // If a general page exists for the current product category, show link - LM
        if (categoryName === category) {
          showLink(i);
          break;
        }
      }
    }
  }

  const showLink = (index: number) => {
    const tempLinkData: LinkObject = {
      category: sizeChartList[index].category,
      link: sizeChartList[index].link
    }
    setLinkData(tempLinkData);
    setRenderLink(true);
  }

  const openModal = () => setModalActive(true);

  const closeModal = () => setModalActive(false);

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
        <div className={styles.modalWrapper}>
          <div dangerouslySetInnerHTML={{ __html: modalData }} />
        </div>
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

  // Prevents layout shift before content loads - LM
  const NoContent = () => (
    <div className={styles.container}></div>
  )

  return renderModalControls ? !modalActive ? <ModalTrigger /> : createPortal(<PopUp />, body.current) : renderLink ? <LinkComponent /> : <NoContent />;
}

SizeChartModal.schema = {
  title: "Size Chart Modal",
  type: "object",
  properties: {}
}

export default SizeChartModal;