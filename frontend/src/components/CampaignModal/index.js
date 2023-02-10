import React, { useState, useEffect } from "react";

import * as Yup from "yup";
import {
	Formik,
	Form,
	Field,
} from "formik";

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	CircularProgress,
    Slider,
	Select,
	InputLabel,
	makeStyles,
	MenuItem,
    Chip,
	TextField,
    Checkbox,
    Typography,
    Box,
} from '@material-ui/core';
import NearMeIcon from '@material-ui/icons/NearMe';
import SaveIcon from '@material-ui/icons/Save';
import { green } from "@material-ui/core/colors";


import { i18n } from "../../translate/i18n";
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";

import api from "../../services/api";
import useWhatsApps from "../../hooks/useWhatsApps";
import SpeedMessageCards from "../SpeedMessageCards";
import WhatsAppLayout from "../WhatsappLayout";
import ConfirmationModal from "../ConfirmationModal";
import MessagesTabs from "../MessagesTabs";
// import Papa from 'papaparse';


const useStyles = makeStyles(theme => ({
    slider: {
      flexGrow: 1,
      width: '100%',
      backgroundColor: theme.palette.background.paper,
    },
    messageTab: {
        "& > div": {
            padding: 0,
            paddingTop: 20
        }
    },
    dialog: {
        "& > div > div": {
            maxWidth: 1200
        }
    },
	textField: {
		marginRight: theme.spacing(1),
		flex: 1,
	},
	container: {
		display: 'flex',
		flexWrap: 'wrap',
	},
    box: {
        marginBottom: 30
    },
    multipleInput: {
        display: "flex",
        width: "100%",
        justifyContent: "space-between",
        marginBottom: 30,
        "@media (max-width: 720px)": {
            flexDirection: "column"
        }
    },
    dateInput: {
        "& > div > input": {
            padding: "11px 14px",
        },
        "& > div": {
            width: "200px",
        },
        "@media (max-width: 720px)": {
            "& > div": {
                width: "100%",
            }
        }
    },
    inputBox: {
        display: "flex",
        alignItems: "center",
        "@media (max-width: 720px)": {
            flexDirection: "column",
            alignItems: "start",
            justifyContent: "center"
        }
    },
    variableContent: {
        display: "flex",
        width: "100%",

    },
    chipBox: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2
    },
    testContainer: {
        width: "100%",
        marginTop: 20
    },
    numberTestContainer: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        marginTop: 10
    },
    previewBox: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        marginTop: 10
    },
    buttonProgress: {
		color: green[500],
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},
    previewContainer: {
        height: "100%", 
        minHeight: "400px", 
        margin: 25,
        "@media (max-width: 720px)": {
            margin: 0,
            marginTop: 20
        }
    }
}));

const marks = [
    {
        value: 0,
        label: '00:00',
    },
    {
        value: 4,
        label: '04:00',
    },
    {
        value: 8,
        label: '08:00',
    },
    {
        value: 12,
        label: '12:00',
    },
    {
        value: 16,
        label: '16:00',
    },
    {
        value: 20,
        label: '20:00',
    },
    {
        value: 24,
        label: '23:59',
    },
  ];

function getFirstDate(){
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    const dateString = currentDate.toISOString().substring(0,16);
    return dateString
}

function getColumns(file, setCsvColumns) {
    // Most perfomatic but dosen't work with ; delimiter
    /* Papa.parse(file, {
        header: true,
        preview: 1,
        delimitersToGuess: [";",".", ",", "-", "/", "|", "_", Papa.RECORD_SEP, Papa.UNIT_SEP],
        complete: (results) => { 
            setCsvColumns(Object.keys(results.data[0])) 
        }
      }); */
      const reader = new FileReader()
      reader.onload = (e) => {
        const csvFile = e.target.result
        const firstLine = csvFile.slice(0, csvFile.indexOf('\n'))
        setCsvColumns(firstLine.trim().split(/[;\\.\\,\-\\/\\|_]+/))
      }
      reader.readAsText(file)
}

const CampaignSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, i18n.t("campaignModal.errors.tooShort"))
		.max(50, i18n.t("campaignModal.errors.tooLong"))
		.required(" "),
    whatsappId: Yup.string().required("Required"),
    columnName: Yup.string().required(" "),
});

const CampaignModal = ({ open, onClose, campaignId, visualize = false }) => {
	const classes = useStyles();
    const { whatsApps } = useWhatsApps()

    const initialState = {
        name: "",
        sendTime: [0, 24],
        delay: "15",
        inicialDate: getFirstDate(),
        startNow: false,
        whatsappId: "",
        columnName: "",
    };

    const [campaignForm, setCapaignForm] = useState(initialState)
    const [sendTime, setSendTime] = useState(initialState.sendTime);
    const [delay, setDelay] = useState("15")
    const [tabValue, setTabValue] = useState(0);
    const [startNow, setStartNow] = useState(false);
    const [csvFile, setCsvFile] = useState(null)
    const [csvColumns, setCsvColumns] = useState([])
    const [submittingForm, setSubmittingForm] = useState(false)
    const [testNumber, setTestNumber] = useState("")
    const [isRepeatModel, setIsRepeatModel] = useState(false)
    const [openPreview, setOpenPreview] = useState(false)
    const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
    const [selectedPreviewMessage, setSelectedPreviewMessage] = useState(null)
    const [inputsOrder, setInputsOrder] = useState({
        message1InputOrder: [],
        message2InputOrder: [],
        message3InputOrder: [],
        message4InputOrder: [],
        message5InputOrder: [],
    })
    const [allMessagesInputs, setAllMessagesInputs] = useState({
        message1Inputs: [],
        message2Inputs: [],
        message3Inputs: [],
        message4Inputs: [],
        message5Inputs: [],
    })
    

    useEffect(() => {
        (async () => {
			if (!campaignId) return;
			try {
				const { data } = await api.get(`/campaigns/${campaignId}`);
                setSendTime(data.sendTime)
                const delayValue =
                    data.delay === "120-240"
                    ? "15"
                    : data.delay === "60-120"
                    ? "30"
                    : data.delay === "30-60"
                    ? "60"
                    : data.delay === "15-30"
                    ? "120"
                    : data.delay === "10-15"
                    ? "240"
                    : null;
                setDelay(delayValue);
                const settedDate = data.inicialDate.substring(0,16)
                try {
                    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/public/${data.contactsCsv}`)
                    const blobFile = await response.blob()
                    if (blobFile) {
                        const file = new File([blobFile], "text.csv", { type: "text/csv"})
                        getColumns(file, setCsvColumns)
                    }
                } catch(err) {
                    toastError(err)
                }
                setIsRepeatModel(["finished", "archived", "canceled"].includes(data.status))
				setCapaignForm(prevState => {
                    if (["finished", "archived", "canceled"].includes(data.status)){
                        return { ...prevState, ...data, inicialDate: getFirstDate()};
                    }
					return { ...prevState, ...data, inicialDate: settedDate};
				});

                setAllMessagesInputs({
                    message1Inputs: data.message1.map((message, index) => {
                        if(message.startsWith("file-")) {
                            return ({id: index, type: "file", value: message})
                        }
                        return ({id: index, type: "text", value: message})
                    }),
                    message2Inputs: data.message2.map((message, index) => {
                        if(message.startsWith("file-")) {
                            return ({ id: index, type: "file", value: message})
                        }
                        return ({id: index, type: "text", value: message})
                    }),
                    message3Inputs: data.message3.map((message, index) => {
                        if(message.startsWith("file-")) {
                            return ({ id: index, type: "file", value: message})
                        }
                        return ({ id: index, type: "text", value: message})
                    }),
                    message4Inputs: data.message4.map((message, index) => {
                        if(message.startsWith("file-")) {
                            return ({ id: index, type: "file", value: message})
                        }
                        return ({ id: index, type: "text", value: message})
                    }),
                    message5Inputs: data.message5.map((message, index) => {
                        if(message.startsWith("file-")) {
                            return ({ id: index, type: "file", value: message})
                        }
                        return ({ id: index, type: "text", value: message})
                    })
                })

                setInputsOrder({
                    message1InputOrder: data.message1.map((message , index) => index),
                    message2InputOrder: data.message2.map((message , index) => index),
                    message3InputOrder: data.message3.map((message , index) => index),
                    message4InputOrder: data.message4.map((message , index) => index),
                    message5InputOrder: data.message5.map((message , index) => index)
                })
			} catch (err) {
				toastError(err);
			}
		})();

		return () => {
			setCapaignForm(initialState);
            setCsvColumns([]);
            setSendTime(initialState.sendTime);
            setDelay("15");
            setCsvFile(null);
            setStartNow(false);
            setIsRepeatModel(false);
            setInputsOrder([]);
            setAllMessagesInputs([]);
		};
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId])


    const handleOnSendTimeInputChange = (event, value) => {
        setSendTime(value);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleOnChecked = () => {
        setStartNow(e => !e)
    }

    const handleOnCsvFileChange = (file) => {
        setCsvColumns([])
        if (!file.target.files[0]) {
            setCsvFile(null)
            setCsvColumns([])
            return
        }
        setCsvFile(file.target.files[0])
        getColumns(file.target.files[0], setCsvColumns)

    }

    const handleDownload = async (isCsvFile, fileName = "") => {
        let response
        if (isCsvFile) {
            response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/public/${campaignForm.contactsCsv}`)
        } else {
            response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/public/${fileName}`)
        }
        const file = await response.blob();
        const fileUrl = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = `${campaignId}contacts`;
        a.click();
        URL.revokeObjectURL(fileUrl);
    }

    const handleOnTest = async (values) => {
        setSubmittingForm(true)
        const { whatsappId, message1 } = values
        if (!whatsappId || !message1 || !testNumber ) {
            toast.error(`${i18n.t("campaigns.notifications.campaignTestFailed")}`);
            setSubmittingForm(false)
            return
        }
        const data = { whatsappId, message1, number: testNumber, mediaUrl: campaignForm.mediaUrl || null }
        const formData = new FormData()
        Object.keys(data).forEach((key) => {
            formData.append(key, data[key])
        })
        // if (mediaFile) {
        //     formData.append("media", mediaFile)
        // }

        try {
            await api.post(`/campaigns/test`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                }
            });
            toast.success(`${i18n.t("campaigns.notifications.campaignTested")}`);
            setSubmittingForm(false)
        } catch (err) {
            setSubmittingForm(false)
            toastError(err)
        }
    }

    const handleOnSave = async(values) => {
        setSubmittingForm(true)
        let form = {...values, delay, startNow, sendTime: JSON.stringify(sendTime)}
        const formData = new FormData();
        let medias = []
        Object.keys(allMessagesInputs).forEach((messageInput, index) => {
            let message = inputsOrder[`message${index+1}InputOrder`].map((i) => {
                const input = allMessagesInputs[messageInput].find(inp => inp.id === i)
                if(input.type === "text"){
                    return input.value ? input.value : null
                } else {
                    if(typeof input.value !== "string" ){
                        medias.push(input.value)
                        return `file-${input.value.name}`
                    }
                    return input.value
                }
            })
            message = JSON.stringify(message.filter(i => i !== null))
            form = {...form, [`message${index+1}`]: message}
        })
        if (
            form.message1.length === 0 
            && form.message2.length === 0 
            && form.message3.length === 0
            && form.message4.length === 0 
            && form.message5.length === 0
            ) {
                toast.error("A mensagem é obrigatória")
                setSubmittingForm(false)
                return
        }
        medias = [...new Set(medias.map(media => media.name))].map(name => {
            return medias.find(media => media.name === name);
        });
        
        medias.forEach((file) => {
            if(typeof file !== "string") formData.append("medias", file)
        })
        if (csvFile) formData.append("medias", csvFile)

        Object.keys(form).forEach((key) => {
            formData.append(key, form[key])
        })

        try {
            if (campaignId && !isRepeatModel) {
                await api.put(`/campaigns/${campaignId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json',
                    }
                });
            } else if (isRepeatModel) {
                await api.post(`/campaigns/repeat/${campaignId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json',
                    }
                });
            } else {
                await api.post("/campaigns", formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json',
                    }
                });
            }
            toast.success(`${i18n.t("campaigns.notifications.campaignSaved")}`);
            onClose();
            setSubmittingForm(false)
        } catch (err) {
            setSubmittingForm(false)
            toastError(err);
        }
    }

    const handleOnModalClose = () => {
		setCapaignForm(initialState);
        setSendTime(initialState.sendTime)
        setCsvColumns([]);
        setDelay("15")
        setCsvFile(null);
        setStartNow(false);
        setIsRepeatModel(false);
        setInputsOrder([])
        setAllMessagesInputs([])
        onClose()
    }

	return (

			<Dialog
				open={open}
				onClose={handleOnModalClose}
				className={classes.dialog}
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{!campaignId && !isRepeatModel
						? `${i18n.t("campaignModal.title.add")}`
						: campaignId && isRepeatModel ?
                        `${i18n.t("campaignModal.title.repeat")}` : `${i18n.t("campaignModal.title.edit")}`
                    }
				</DialogTitle>
				<Formik
					initialValues={campaignForm}
					enableReinitialize={true}
					validationSchema={CampaignSchema}
					onSubmit={async (values, actions) => {
						setTimeout(async () => {
                            if (campaignId && !isRepeatModel) {
                                handleOnSave(values)
                            } else {
                                setConfirmationModalOpen(true);
                            }
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ touched, errors, isSubmitting, values, setValues }) => {
                        return(

                        <>
                            <ConfirmationModal
                            open={confirmationModalOpen}
                            title={i18n.t("campaignModal.confirmationModal.title")}
                            confirmLabel={i18n.t("campaignModal.confirmationModal.confirmLabel")}
                            onClose={setConfirmationModalOpen}
                            onConfirm={() => handleOnSave(values)}
                            haveConfirmationSelect
                        >
                            <>
                                <Typography style={{ fontWeight: "bold"}}>
                                    {i18n.t("campaignModal.confirmationModal.confirmMessage.title")}
                                </Typography>
                                <ul>
                                    <li>
                                        Após o início dos envios, a mensagem <span style={{ fontWeight: "bold"}}>não pode ser alterada</span>
                                    </li>
                                    <li>
                                        O WhatsApp pode <spam style={{ fontWeight: "bold", color: "red" }}>banir</spam> o seu número caso as mensagens sejam denunciadas como 
                                        <spam style={{ fontWeight: "bold", color: "red" }}> SPAM</spam>
                                    </li>
                                    <li>
                                        Não nós responsabilizamos caso seu número seja banido
                                    </li>
                                    <li>
                                        Ao iniciar a campanha, você concorda com os <span> </span>
                                        <a target="_blank" rel="noopener noreferrer" href="https://www.whatsapp.com/legal/terms-of-service">
                                            termos de uso do WhatsApp
                                        </a>
                                    </li>
                                </ul>
                            </>
                        
                        </ConfirmationModal>
                        
						<Form>
							<DialogContent dividers style={{ widht: 800, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
                                <Box sx={{ width: "100%" }}  className={classes.box}>
                                    <Typography variant="h6">
                                        {i18n.t("campaignModal.form.sendTime")}
                                    </Typography>
                                    <div style={{ paddingLeft: 15, paddingRight: 15}}>
                                        <Slider
                                            disabled={visualize}
                                            getAriaLabel={() => 'Hours'}
                                            name="sendTime"
                                            id="sendTime"
                                            step={1}
                                            max={24}
                                            onChange={handleOnSendTimeInputChange}
                                            valueLabelDisplay="auto"
                                            marks={marks}
                                            value={sendTime}
                                            getAriaValueText={(value) => `${value}:00HRS`}
                                            valueLabelFormat={(value) => `${value}:00`}
                                        />
                                    </div>   

                                </Box>
                                <Box sx={{ width: "100%" }} className={classes.box}>
                                    <Typography variant="h6">
                                        {i18n.t("campaignModal.form.delay")}
                                    </Typography> 
                                    <Box>
                                        <SpeedMessageCards delay={delay} setDelay={visualize ? ()=>{} : setDelay}/>
                                    </Box> 
                                </Box>
                                <Box sx={{ width: "100%" }} className={classes.box}>
                                    <Typography variant="h6">
                                        {i18n.t("campaignModal.form.name")}
                                    </Typography> 
                                    <Field
                                        as={TextField}
                                        placeholder={i18n.t("campaignModal.form.name")}
                                        name="name"
                                        id="name"
                                        disabled={visualize}
                                        error={touched.name && Boolean(errors.name)}
                                        helperText={touched.name && errors.name}
                                        variant="outlined"
                                        margin="dense"
                                        style={{ width : "100%"}}
                                        className={classes.textField}
                                    />
                                </Box>
                                <Box className={classes.multipleInput}>
                                    <Box style={{ width: "50%"}}>
                                        <Typography variant="h6">
                                            {i18n.t("campaignModal.form.start")}
                                        </Typography> 
                                        <Box className={classes.inputBox }>
                                            <Field
                                                as={TextField}
                                                id="inicialDate"
                                                name="inicialDate"
                                                type="datetime-local"
                                                variant="outlined"
                                                disabled={startNow || visualize}
                                                className={classes.dateInput}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                            <Box style={{ display: "flex", alignItems: "center" }}>
                                                <Checkbox
                                                  checked={startNow}
                                                  disabled={visualize}
                                                  name="startNow"
                                                  onChange={handleOnChecked}
                                                  color={"primary"}
                                                  inputProps={{ 'aria-label': 'primary checkbox' }}
                                                />
                                                <InputLabel>{i18n.t("campaignModal.form.startCheck")}</InputLabel>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box style={{ width: "50%"}}>
                                        <Typography variant="h6">
                                            {i18n.t("campaignModal.form.whatsappId")}
                                        </Typography> 
                                        <Field
											as={Select}
											name="whatsappId"
                                            id="whatsappId"
                                            disabled={visualize}
                                            error={touched.whatsappId && Boolean(errors.whatsappId)}
                                            helperText={touched.whatsappId && errors.whatsappId}
                                            variant="outlined"
                                            margin="dense"
                                            style={{ width: "100%", paddingRight: 10}}
										>
											{whatsApps?.map((whatsapp) => (
												<MenuItem key={whatsapp.id} value={`${whatsapp.id}`}>{whatsapp.name}</MenuItem>
											))}
										</Field>
                                    </Box>
                                </Box>
                                <Box sx={{ width: "100%" }} className={classes.box}>
                                    <Box className={classes.multipleInput}>
                                        <Box style={{ width: "50%"}}>
                                            <Typography variant="h6">
                                                {i18n.t("campaignModal.form.csvMedia")}
                                            </Typography>
                                            <Box style={{ display: "flex", flexDirection: "column", alignItems: "start", marginTop: 15}}>
                                                {
                                                    campaignId ? 
                                                        <Button
                                                            style={{ marginBottom: 10 }}
                                                            onClick={() => handleDownload(true)}
                                                            color="primary"
                                                            disabled={isSubmitting}
                                                            variant="contained"
                                                        >
                                                            Download
                                                        </Button>
                                                    : ""
                                                }
                                                { !visualize && (
                                                    <input 
                                                        style={{ marginTop: 5, cursor: "pointer" }}
                                                        onChange={handleOnCsvFileChange}
                                                        accept=".csv"
                                                        type="file" 
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                        <Box style={{ width: "50%"}}>
                                            <Typography variant="h6">
                                                {i18n.t("campaignModal.form.columnName")}
                                            </Typography> 
                                            <Field
                                                as={Select}
                                                name="columnName"
                                                id="columnName"
                                                disabled={visualize}
                                                error={touched.columnName && Boolean(errors.columnName)}
                                                helperText={touched.columnName && errors.columnName}
                                                variant="outlined"
                                                margin="dense"
                                                placeholder="test"
                                                style={{ width: "100%", paddingRight: 10}}
                                            >
                                                {csvColumns?.map((col, index) => (
                                                    <MenuItem key={index} value={`${col}`}>{col}</MenuItem>
                                                ))}
                                            </Field>
                                        </Box>
                                    </Box>
                                </Box>
                                <MessagesTabs 
                                    classes={classes} 
                                    tabValue={tabValue} 
                                    handleTabChange={handleTabChange} 
                                    values={values} 
                                    setTabValue={setTabValue} 
                                    errors={errors} 
                                    setValues={setValues}
                                    inputsOrder={inputsOrder}
                                    setInputsOrder={setInputsOrder}
                                    setAllMessagesInputs={setAllMessagesInputs}
                                    allMessagesInputs={allMessagesInputs}
                                    setSelectedPreviewMessage={setSelectedPreviewMessage}
                                    setOpenPreview={setOpenPreview}
                                    handleDownload={handleDownload}
                                    visualize={visualize}
                                />
                                <Box className={classes.variableContent}>
                                    <InputLabel style={{ display: "flex", alignItems: "center", marginRight: 2}}>{i18n.t("campaignModal.form.variables")}</InputLabel>
                                    <Box className={classes.chipBox}>
                                        {csvColumns.map((col, index) => 
                                            <Chip key={index} label={col} />
                                        )}
                                    </Box>
                                </Box>
                                <Box sx={{ width: "100%", marginTop: 10 }} className={classes.box}>
                                    <Dialog
                                        open={openPreview}
                                        onClose={() => {setOpenPreview(false)}}
                                        className={classes.dialog}
                                        scroll="paper"
                                    >   
                                        <DialogTitle id="form-dialog-title">
                                            {i18n.t("campaignModal.title.preview")+":"}
                                        </DialogTitle>
                                        <DialogContent style={{ padding: 0, minHeight: "400px"}}>
                                            <Box className={classes.previewContainer}>
                                                <WhatsAppLayout 
                                                    messages={allMessagesInputs[`message${selectedPreviewMessage}Inputs`]}
                                                    order={inputsOrder[`message${selectedPreviewMessage}InputOrder`]}
                                                    
                                                />
                                            </Box>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button
                                                onClick={()=>{setOpenPreview(false)}}
                                                variant="outlined"
                                            >
                                                {i18n.t("campaignModal.buttons.close")}
                                            </Button>
                                        </DialogActions>
                                    </Dialog>
                                    <Box className={classes.testContainer}>
                                        <Typography variant="h6">
                                            {i18n.t("campaignModal.form.testMessage")}
                                        </Typography>
                                        <Box className={classes.numberTestContainer}>
                                            <TextField
                                                className={classes.inputTest}
                                                placeholder={i18n.t("campaignModal.form.testNumberPlaceholder")}
                                                inputProps={{ 'aria-label': 'message test' }}
                                                variant="outlined"
                                                size="small"
                                                style={{ width: "100%" }}
                                                onChange={(e) => setTestNumber(e.target.value)}
                                            />
                                            <Button
                                                color="primary"
                                                disabled={submittingForm}
                                                variant="contained"
                                                onClick={() => handleOnTest(values)}
                                                style={{ marginLeft: 20 }}
                                                >
                                                {i18n.t("campaignModal.form.testButton")}
                                                {submittingForm && (
                                                    <CircularProgress
                                                        size={20}
                                                        className={classes.buttonProgress}
                                                    />
                                                )}
                                        </Button>
                                        </Box>
                                    </Box>
                                </Box>
							</DialogContent>
							<DialogActions>
                                {
                                    visualize ? 
                                    <>
                                        <Button
                                            type="submit"
                                            color="primary"
                                            onClick={onClose}
                                            variant="contained"
                                        >
                                            {i18n.t("campaignModal.buttons.close")}
                                        </Button>
                                    </> 
                                    :
                                    <>
                                        <Button
                                            onClick={onClose}
                                            color="secondary"
                                            disabled={submittingForm}
                                            variant="outlined"
                                        >
                                            {i18n.t("campaignModal.buttons.cancel")}
                                        </Button>
                                        <Button
                                            type="submit"
                                            color="primary"
                                            disabled={submittingForm}
                                            variant="contained"
                                        >
                                            {
                                                !campaignId && !isRepeatModel
                                                    ? <span style={{ display: "flex", alignItems: "center"}}>{i18n.t("campaignModal.buttons.okAdd")}<NearMeIcon style={{ marginLeft: 5}} /></span>
                                                    : campaignId && isRepeatModel ?
                                                    <span style={{ display: "flex", alignItems: "center"}}>{i18n.t("campaignModal.buttons.okAdd")}<NearMeIcon style={{ marginLeft: 5}} /></span> 
                                                    : <span style={{ display: "flex", alignItems: "center"}}>{i18n.t("campaignModal.buttons.okEdit")}<SaveIcon style={{ marginLeft: 5}} /></span>
                                                
                                            }
                                            {submittingForm && (
                                                <CircularProgress
                                                    size={24}
                                                    className={classes.buttonProgress}
                                                />
                                            )}
                                        </Button>
                                    </>
                                }
							</DialogActions>
						</Form>
                        </>
					)}}
				</Formik>
			</Dialog>
	);
};

export default React.memo(CampaignModal);