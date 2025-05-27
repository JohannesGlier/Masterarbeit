import React, { useState } from "react";
import styles from "./CanvasPromptArrowToolbar.module.css";
import { useCanvas } from "@/components/Canvas/CanvasContext";
import EditTemplateModal, { availableIconsList } from "@/components/Canvas/CanvasToolbar/EditTemplateModal";
import { BiQuestionMark } from "react-icons/bi";

const FallbackIconComponent = availableIconsList['BiQuestionMark']?.component || BiQuestionMark;

const initialTemplatesData = [
  {
    id: "Template_1",
    name: "Idea Generator",
    iconName: "FcIdea",
    color: "#FF0000",
    prompt: "Generate 4 creative Ideas",
    iconSize: 40,
  },
  {
    id: "Template_2",
    name: "Definition",
    iconName: "FaBook",
    color: "#00FF00",
    prompt: "Give me a detailed definition",
    iconSize: 40,
  },
  {
    id: "Template_3",
    name: "Keywords",
    iconName: "AiFillEdit",
    color: "#0000FF",
    prompt: "Generate 4 related keywords",
    iconSize: 40,
  },
  {
    id: "Template_4",
    name: "Assoziation",
    iconName: "AiOutlineFork",
    color: "#FFFF00",
    prompt: "Generate 4 unique assoziations",
    iconSize: 40,
  },
  {
    id: "Template_5",
    name: "Questions",
    iconName: "AiOutlineQuestionCircle",
    color: "#FF00FF",
    prompt: "Generate 4 questions to help me explore the topic further",
    iconSize: 40,
  },
];

const CanvasPromptArrowToolbar = ({ style }) => {
  const { selectedArrowTemplate, setSelectedArrowTemplate, selectedTool, setSelectedTool } = useCanvas();
  const [templates, setTemplates] = useState(initialTemplatesData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleLeftClick = (template) => {
    if (selectedArrowTemplate && selectedArrowTemplate.id === template.id) {
      setSelectedArrowTemplate(null);
    } else {
      setSelectedArrowTemplate(template);
    }
    console.log("Selected Arrow Tempalte:", template.name);
  };

  const handleRightClick = (event, template) => {
    event.preventDefault();
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleSaveTemplate = (updatedTemplate) => {
    setTemplates((prevTemplates) =>
      prevTemplates.map((t) =>
        t.id === updatedTemplate.id ? updatedTemplate : t
      )
    );
    if (selectedArrowTemplate && selectedArrowTemplate.id === updatedTemplate.id) {
      setSelectedArrowTemplate(updatedTemplate);
    }
  };

  return (
    <>
      <div className={styles.promptArrowToolbar} style={style}>
        {templates.map((template) => {
          const iconInfo = availableIconsList[template.iconName];
          const IconComponent = iconInfo?.component || FallbackIconComponent;
          const iconStyle = iconInfo?.style || {};

          const isSelected = selectedArrowTemplate?.id === template.id;

          return (
            <button
              key={template.id}
              title={`${template.name}: ${template.prompt}`}
              className={`${styles.button} ${isSelected ? styles.selectedButton : ""}`}
              onClick={() => handleLeftClick(template)}
              onContextMenu={(e) => handleRightClick(e, template)}
            >
              <IconComponent size={template.iconSize || 30} style={iconStyle} />
            </button>
          );
        })}
      </div>

      <EditTemplateModal
        template={editingTemplate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTemplate}
      />
    </>
  );
};

export default CanvasPromptArrowToolbar;
