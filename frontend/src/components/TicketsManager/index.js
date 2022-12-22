import React, { useContext, useEffect, useState } from "react";

import { 
  Badge,
  Button,
  FormControlLabel,
  makeStyles,
  Paper,
  Tab,
  Tabs,
  Switch
} from "@material-ui/core";

import {
  AllInboxRounded,
  HourglassEmptyRounded,
  MoveToInbox,
  Search
} from "@material-ui/icons";
import { Cascader } from 'antd'

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsList";
import TabPanel from "../TabPanel";
import { TagsFilter } from "../TagsFilter";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
// import useQueues from "../../hooks/useQueues";
import api from "../../services/api";



import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  tabsHeader: {
    flex: "none",
    backgroundColor: theme.palette.background.default,
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 8,
  },

  tab: {
    minWidth: 120,
    width: 120,
  },

  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
  },

  serachInputWrapper: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
    display: "flex",
    borderRadius: 40,
    padding: 4,
    marginRight: theme.spacing(1),
  },

  searchIcon: {
    color: theme.palette.primary.main,
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center",
  },

  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 25,
    padding: "10px",
    outline: "none",
  },

  badge: {
    right: 0,
  },
  show: {
    display: "block",
  },
  hide: {
    display: "none !important",
  },
  searchContainer: {
    display: "flex",
    padding: "10px",
    borderBottom: "2px solid rgba(0, 0, 0, .12)",
  },
}));

const TicketsManager = () => {
  const classes = useStyles();

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  const [tabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const { user } = useContext(AuthContext);

  const [, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);

  const userQueueIds = user.queues.map((q) => q.id);
  const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);

  const [adminFilterOptions, setAdminFilterOptions] = useState([])

  // const { findAll: findAllQueues } = useQueues();

  const queuesChildren =  user?.queues.map((queue) => { return {value: `${queue.id}`, label: queue.name}})

  const data = 
    [
      {
        value: 'queue',
        label: 'Setor',
        children: queuesChildren,
      },
      {
        value: 'atendente',
        label: 'Atendente',
        isLeaf: false,
      },
      {
        value: 'conection',
        label: 'Conexão',
        isLeaf: false,
      },
      
    ]
  
  const [options, setOptions] = useState(data)

  const loadData = async (selectedOptions) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;
    if(targetOption.value === "atendente") {
      const { data } = await api.get("/users/", {
            params: { searchParam },
          });
      const aten = data.users.map((e) => {return { value: e.id, label: e.name}})
      setTimeout(()=> {
        targetOption.loading = false;
        targetOption.children = aten
        
        setOptions([...options]);
      }, 1000)
    }

    if(targetOption.value === 'conection'){
      const { data } = await api.get("/whatsapp/");
      const cons = data.map((con) => {return { value: con.id, label: con.name}})
      setTimeout(()=> {
        targetOption.loading = false;
        targetOption.children = cons
    
        setOptions([...options]);
      }, 1000)
    }


    // Getting queues from api
    /* if(targetOption.value === 'queue'){
      let queuesChildren
      if(user?.profile === 'admin'){
        const list = await findAllQueues();
        queuesChildren = list.map((queue) => { return {value: `${queue.id}`, label: queue.name}})
      } else {
        queuesChildren = user?.queues.map((queue) => { return {value: `${queue.id}`, label: queue.name}})
      }
  
      setTimeout(()=> {
        targetOption.loading = false;
        targetOption.children = queuesChildren
    
        setOptions([...options]);
      }, 1000)
    } */

  }

  useEffect(() => {
    if (user.profile.toUpperCase() === "ADMIN") {
      setShowAllTickets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const handleSearch = (e) => {
    const searchedTerm = e.target.value.toLowerCase();


    setSearchParam(searchedTerm);
    if (searchedTerm === "") {
      setTab("open");
    } else if (tab !== "search") {
      setTab("search");
    }

  };

  const handleSelectedTags = (selecteds) => {
    const tags = selecteds.map(t => t.id);
    setSelectedTags(tags);
  }

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  const applyPanelStyle = (status) => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  return (
    <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={(e) => setNewTicketModalOpen(false)}
      />
      <Paper elevation={0} square className={classes.searchContainer}>
        <Search className={classes.searchIcon} />
        <input
          type="text"
          placeholder={i18n.t("tickets.search.placeholder")}
          className={classes.searchInput}
          value={searchParam}
          onChange={handleSearch}
        />
      </Paper>
      <Paper elevation={0} square className={classes.tabsHeader}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="icon label tabs example"
        >
          <Tab
            value={"open"}
            icon={<MoveToInbox />}
            label={i18n.t("tickets.tabs.open.title")}
            classes={{ root: classes.tab }}
          />
          <Tab
            value={"pending"}
            icon={<HourglassEmptyRounded />}
            label={
              <Badge
                className={classes.badge}
                badgeContent={pendingCount}
                color="secondary"
              >
                {i18n.t("ticketsList.pendingHeader")}
              </Badge>
            }
            classes={{ root: classes.tab }}
          />
          <Tab
            value={"closed"}
            icon={<AllInboxRounded />}
            label={i18n.t("tickets.tabs.closed.title")}
            classes={{ root: classes.tab }}
          />
        </Tabs>
      </Paper>
      <Paper square elevation={0} className={classes.ticketOptionsBox}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setNewTicketModalOpen(true)}
        >
          {i18n.t("ticketsManager.buttons.newTicket")}
        </Button>
        <Can
          role={user.profile}
          perform="tickets-manager:showall"
          yes={() => (
            <FormControlLabel
              label={i18n.t("tickets.buttons.showAll")}
              labelPlacement="start"
              control={
                <Switch
                  size="small"
                  checked={showAllTickets}
                  onChange={() =>
                    setShowAllTickets((prevState) => !prevState)
                  }
                  name="showAllTickets"
                  color="primary"
                />
              }
            />
          )}
        />
        {user?.profile === 'admin' ?
        <Cascader multiple options={options} onChange={(e)=> setAdminFilterOptions(e)} placeholder="Filtros" loadData={loadData}/>
        :
        <TicketsQueueSelect
          style={{ marginLeft: 6 }}
          selectedQueueIds={selectedQueueIds}
          userQueues={user?.queues}
          onChange={(values) => setSelectedQueueIds(values)}
        />
        }

      </Paper>
      <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
      <TagsFilter onFiltered={handleSelectedTags} />
        <Paper className={classes.ticketsWrapper}>
          <TicketsList
            status="open"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            updateCount={(val) => setOpenCount(val)}
            style={applyPanelStyle("open")}
            adminFilterOptions={adminFilterOptions}
          />
          <TicketsList
            status="pending"
            updateCount={(val) => setPendingCount(val)}
            selectedQueueIds={selectedQueueIds}
            showAll={showAllTickets}
            style={applyPanelStyle("pending")}
            adminFilterOptions={adminFilterOptions}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tab} name="pending" className={classes.ticketsWrapper}>
      <TagsFilter onFiltered={handleSelectedTags} />
        <TicketsList
          status="pending"
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          adminFilterOptions={adminFilterOptions}
        />
      </TabPanel>



      <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
      <TagsFilter onFiltered={handleSelectedTags} />
        <TicketsList
          status="closed"
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          adminFilterOptions={adminFilterOptions}
        />
      </TabPanel>
      <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
      <TagsFilter onFiltered={handleSelectedTags} />
        <TicketsList
          searchParam={searchParam}
          tags={selectedTags}
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          adminFilterOptions={adminFilterOptions}
        />
      </TabPanel>
    </Paper>
  );
};

export default TicketsManager;