import React, { useState, useEffect } from 'react';
import styles from '@/components/Canvas/CanvasToolbar/EditTemplateModal.module.css';

import { BiPalette } from "react-icons/bi";
import { FcIdea, FcMindMap } from "react-icons/fc";
import { AiFillSignal, AiFillThunderbolt, AiOutlineFork, AiOutlineGift, AiOutlineQuestionCircle, AiFillEdit } from "react-icons/ai";
import { FaBook } from "react-icons/fa";
import { IoDice } from "react-icons/io5";

// Definition der verfügbaren Icons
export const availableIconsList = {
    FcIdea: { component: FcIdea, name: "Light Bulb" },
    BiPalette: { component: BiPalette, name: "Palette" },
    FcMindMap: { component: FcMindMap, name: "Mindmap" },
    AiFillSignal: { component: AiFillSignal, name: "Signal" },
    AiFillThunderbolt: { component: AiFillThunderbolt, name: "Thunderbolt" },
    AiOutlineFork: { component: AiOutlineFork, name: "Connections" },
    AiOutlineGift: { component: AiOutlineGift, name: "Gift" },
    AiOutlineQuestionCircle: { component: AiOutlineQuestionCircle, name: "Questionmark" },
    AiFillEdit: { component: AiFillEdit, name: "Edit" },
    FaBook: { component: FaBook, name: "Book" },
    IoDice: { component: IoDice, name: "Dice" },
};

const iconOptionsForPicker = Object.entries(availableIconsList).map(([key, value]) => ({
    id: key,
    Component: value.component,
    style: value.style || {}
}));

const IconPicker = ({ selectedIconName, onIconSelect }) => {
    return (
        <div className={styles.iconGrid}>
            {iconOptionsForPicker.map(iconOpt => {
                const IconComponent = iconOpt.Component;
                if (!IconComponent) {
                    console.error(`IconComponent is undefined for id: ${iconOpt.id}. Check availableIconsList and imports.`);
                    return null;
                }
                const isSelected = selectedIconName === iconOpt.id;
                return (
                    <button
                        key={iconOpt.id}
                        type="button"
                        className={`${styles.iconCell} ${isSelected ? styles.selectedIconCell : ''}`}
                        onClick={() => onIconSelect(iconOpt.id)}
                        title={availableIconsList[iconOpt.id]?.name || iconOpt.id}
                    >
                        <IconComponent size={24} style={iconOpt.style} />
                    </button>
                );
            })}
        </div>
    );
};

const EditTemplateModal = ({ template, isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [currentIconName, setCurrentIconName] = useState('');
    const [color, setColor] = useState('#FFFFFF');
    const [prompt, setPrompt] = useState('');

    useEffect(() => {
        if (template) {
            setName(template.name);
            setCurrentIconName(template.iconName);
            setColor(template.color);
            setPrompt(template.prompt);
        } else {
            setName('');
            setCurrentIconName(iconOptionsForPicker.length > 0 && availableIconsList[iconOptionsForPicker[0].id] ? iconOptionsForPicker[0].id : '');
            setColor('#FFFFFF');
            setPrompt('');
        }
    }, [template]);

    if (!isOpen || !template) return null;

    const handleSave = () => {
        onSave({ ...template, name, iconName: currentIconName, color, prompt });
        onClose();
    };

    const handleIconSelect = (selectedId) => {
        setCurrentIconName(selectedId);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Edit Template: {template.name}</h2>
                
                <div className={styles.formGroup}>
                    <label htmlFor="templateName">Identifier:</label>
                    <input
                        type="text"
                        id="templateName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.formInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Icon:</label>
                    <IconPicker selectedIconName={currentIconName} onIconSelect={handleIconSelect} />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="templateColor">Arrow Color:</label>
                    <input
                        type="color"
                        id="templateColor"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className={styles.formColorInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="templatePrompt">Custom Prompt:</label>
                    <textarea
                        id="templatePrompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows="4"
                        className={styles.formTextarea}
                    />
                </div>

                <div className={styles.modalActions}>
                    <button onClick={handleSave} className={`${styles.modalButton} ${styles.saveButton}`}>Speichern</button>
                    <button onClick={onClose} className={`${styles.modalButton} ${styles.cancelButton}`}>Abbrechen</button>
                </div>
            </div>
        </div>
    );
};

export default EditTemplateModal;