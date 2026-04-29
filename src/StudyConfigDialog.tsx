import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import {
    ALL_STUDY_FIELDS,
    STUDY_FIELD_LABELS,
    type StudyConfig,
    type StudyField,
} from "./studyTypes";

type Props = {
    open: boolean;
    onClose: () => void;
    onStart: (config: StudyConfig) => void;
    hasCards: boolean;
    /** Shown when `hasCards` is false (e.g. no starred cards for starred-only study). */
    emptyHint?: string;
};

function toggleInList(list: StudyField[], field: StudyField): StudyField[] {
    if (list.includes(field)) {
        return list.filter((f) => f !== field);
    }
    return [...list, field];
}

export function StudyConfigDialog({ open, onClose, onStart, hasCards, emptyHint }: Props) {
    const [front, setFront] = useState<StudyField[]>(["traditional"]);
    const [back, setBack] = useState<StudyField[]>(["pinyin", "english"]);

    const canStart = hasCards && front.length > 0 && back.length > 0;

    const handleStart = () => {
        if (!canStart) {
            return;
        }
        onStart({ front, back });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Study session</DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ pt: 0.5 }}>
                    {!hasCards ? (
                        <Typography color="text.secondary">
                            {emptyHint ??
                                "Add at least one card before studying."}
                        </Typography>
                    ) : null}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={3}
                        useFlexGap
                        sx={{ alignItems: "flex-start", width: "100%" }}
                    >
                        <FormControl
                            component="fieldset"
                            variant="standard"
                            disabled={!hasCards}
                            sx={{ flex: 1, minWidth: 0, width: "100%" }}
                        >
                            <FormLabel component="legend" sx={{ mb: 1 }}>
                                Shown first (front of card)
                            </FormLabel>
                            <FormGroup>
                                {ALL_STUDY_FIELDS.map((field) => (
                                    <FormControlLabel
                                        key={`front-${field}`}
                                        control={
                                            <Checkbox
                                                checked={front.includes(field)}
                                                onChange={() =>
                                                    setFront((s) =>
                                                        toggleInList(s, field)
                                                    )
                                                }
                                            />
                                        }
                                        label={STUDY_FIELD_LABELS[field]}
                                    />
                                ))}
                            </FormGroup>
                        </FormControl>
                        <FormControl
                            component="fieldset"
                            variant="standard"
                            disabled={!hasCards}
                            sx={{ flex: 1, minWidth: 0, width: "100%" }}
                        >
                            <FormLabel component="legend" sx={{ mb: 1 }}>
                                Revealed on flip (back of card)
                            </FormLabel>
                            <FormGroup>
                                {ALL_STUDY_FIELDS.map((field) => (
                                    <FormControlLabel
                                        key={`back-${field}`}
                                        control={
                                            <Checkbox
                                                checked={back.includes(field)}
                                                onChange={() =>
                                                    setBack((s) =>
                                                        toggleInList(s, field)
                                                    )
                                                }
                                            />
                                        }
                                        label={STUDY_FIELD_LABELS[field]}
                                    />
                                ))}
                            </FormGroup>
                        </FormControl>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleStart}
                    disabled={!canStart}
                >
                    Start studying
                </Button>
            </DialogActions>
        </Dialog>
    );
}
