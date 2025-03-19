import styles from "./HomeScreen.module.css";
import HomeScreenButton from "@/components/HomeScreen/HomeScreenButton";
import { sendMessageToChatGPT } from "@/services/chatService";

const HomeScreen = ({ onSelectCanvas }) => {
  const buttons = [
    { label: "Demo 1" },
    { label: "Demo 2", message: "Tell me a joke" },
    { label: "Demo 3", message: "What is the capital of France?" },
    { label: "Demo 4", message: "Who wrote Romeo and Juliet?" },
    { label: "Demo 5", message: "What is the speed of light?" },
    { label: "Demo 6", message: "Explain photosynthesis" },
    { label: "Demo 7", message: "What is AI?" },
    { label: "Demo 8", message: "Who is Albert Einstein?" },
  ];

  const handleButtonClick = async (index, message) => {
    onSelectCanvas(index);

    if (message) {
      try {
        const response = await sendMessageToChatGPT(message);
        console.log(response);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className={styles["home-container"]}>
      <h1>Wähle eine Demo</h1>
      <div className={styles["button-grid"]}>
        {buttons.map((btn, index) => (
          <HomeScreenButton
            key={index}
            label={btn.label}
            onClick={() => handleButtonClick(index, btn.message)}
          />
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
