function ImageModal({ isOpen, onClose, imageSrc }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <img src={imageSrc} alt="Full Size" style={styles.image} />
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    // Container just centers the image
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    // Image itself carries the constraints
    maxWidth: "70vw", // Force image to never exceed 70% of viewport width
    maxHeight: "90vh", // Force image to never exceed 90% of viewport height
    width: "auto", 
    height: "auto",
    objectFit: "contain",
    borderRadius: "4px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
};

export default ImageModal;
