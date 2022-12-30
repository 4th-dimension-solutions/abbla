import { Chip, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useState } from "react";
import toastError from "../../errors/toastError";
import api from "../../services/api";

export function TagsFilter ({ onFiltered, selecteds, setSelecteds }) {

    const [tags, setTags] = useState([]);
    

    useEffect(() => {
        async function fetchData () {
            await loadTags();
        }
        fetchData();
    }, []);

    const loadTags = async () => {
        try {
            const { data } = await api.get(`/tags/list`);
            setTags(data);
        } catch (err) {
            toastError(err);
        }
    }

    const onChange = async (value) => {
        setSelecteds(value);
        onFiltered(value);
    }

    return (
        <div style={{ padding: 0, margin: 0}}>
            <Autocomplete
                multiple
                size="small"
                style={{ padding: 0, margin: 0}}
                options={tags}
                value={selecteds}
                onChange={(e, v, r) => onChange(v)}
                getOptionLabel={(option) => option.name}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            variant="outlined"
                            style={{backgroundColor: option.color || '#eee', textShadow: '1px 1px 1px #000', color: 'white'}}
                            label={option.name}
                            {...getTagProps({ index })}
                            size="small"
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField {...params} variant="outlined" placeholder="Filtro por Tags" style={{ padding: 0 }}/>
                )}
            />
        </div>
    )
}