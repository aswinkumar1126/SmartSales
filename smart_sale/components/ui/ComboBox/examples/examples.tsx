"use client";

/**
 * Reference usage of the generic <ComboBox /> (components/ComboBox). Not wired
 * into any route — import individual demos from here while wiring up a page,
 * or render <ComboBoxExamples /> directly to see all of them at once.
 */

import { useCallback, useMemo, useState } from "react";
import { Avatar, Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { ComboBox } from "../ComboBox";

// ─────────────────────────────────────────────────────────────────────────
// Shared demo data
// ─────────────────────────────────────────────────────────────────────────

interface Fruit {
  id: number;
  name: string;
}

const FRUITS: Fruit[] = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Banana" },
  { id: 3, name: "Cherry" },
  { id: 4, name: "Date" },
  { id: 5, name: "Elderberry" },
  { id: 6, name: "Fig" },
  { id: 7, name: "Grape" },
  { id: 8, name: "Honeydew" },
];

const getFruitLabel = (f: Fruit) => f.name;
const getFruitValue = (f: Fruit) => f.id;

// ─────────────────────────────────────────────────────────────────────────
// 1. Basic local search
// ─────────────────────────────────────────────────────────────────────────

export function BasicLocalSearchDemo() {
  const [value, setValue] = useState<string | number | null>(null);

  return (
    <Box maxW="320px">
      <ComboBox<Fruit>
        data={FRUITS}
        getLabel={getFruitLabel}
        getValue={getFruitValue}
        value={value}
        onValueChange={setValue}
        placeholder="Select a fruit"
        clearable
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Remote API search using TanStack Query + 500ms debounce
// ─────────────────────────────────────────────────────────────────────────

interface StarWarsPerson {
  name: string;
  height: string;
}

export function RemoteSearchWithDebounceDemo() {
  const [value, setValue] = useState<string | number | null>(null);
  const [selectedItem, setSelectedItem] = useState<StarWarsPerson | null>(null);

  // TanStack Query drives the actual fetch/cache; the ComboBox just needs an
  // `onSearch` that returns a Promise<T[]> for the current query text.
  const searchPeople = useCallback(async (query: string): Promise<StarWarsPerson[]> => {
    const res = await fetch(`https://swapi.py4e.com/api/people/?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    return (data.results ?? []) as StarWarsPerson[];
  }, []);

  return (
    <Box maxW="320px">
      <ComboBox<StarWarsPerson>
        getLabel={(p) => p.name}
        getValue={(p) => p.name}
        remoteSearch
        onSearch={searchPeople}
        debounceMs={500}
        minSearchLength={2}
        value={value}
        selectedItem={selectedItem}
        onChange={setSelectedItem}
        onValueChange={setValue}
        placeholder="Search Star Wars characters"
        searchPlaceholder="Type at least 2 characters…"
        emptyMessage="No characters found"
     
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Multiple selection
// ─────────────────────────────────────────────────────────────────────────

export function MultiSelectDemo() {
  const [values, setValues] = useState<Array<string | number>>([]);

  return (
    <Box maxW="360px">
      <ComboBox<Fruit>
        data={FRUITS}
        getLabel={getFruitLabel}
        getValue={getFruitValue}
        multiple
        values={values}
        onValuesChange={setValues}
        placeholder="Select fruits"
        clearable
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 4. React Hook Form integration
// ─────────────────────────────────────────────────────────────────────────

interface OrderForm {
  fruitId: string | number | null;
}

export function ReactHookFormDemo() {
  const { control, handleSubmit, formState } = useForm<OrderForm>({
    defaultValues: { fruitId: null },
  });

  const onSubmit = handleSubmit((values) => {
    // eslint-disable-next-line no-console
    console.log("submitted", values);
  });

  return (
    <Box maxW="320px" as="form" onSubmit={onSubmit}>
      <Controller
        name="fruitId"
        control={control}
        rules={{ required: "Please choose a fruit" }}
        render={({ field, fieldState }) => (
          <ComboBox<Fruit>
            data={FRUITS}
            getLabel={getFruitLabel}
            getValue={getFruitValue}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            required
            invalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
            placeholder="Select a fruit"
          />
        )}
      />
      <Button type="submit" mt="3" size="sm" loading={formState.isSubmitting}>
        Submit
      </Button>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Disabled state
// ─────────────────────────────────────────────────────────────────────────

export function DisabledDemo() {
  return (
    <Box maxW="320px">
      <ComboBox<Fruit>
        data={FRUITS}
        getLabel={getFruitLabel}
        getValue={getFruitValue}
        value={2}
        selectedItem={FRUITS[1]}
        disabled
        placeholder="Select a fruit"
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Custom rendered items (avatar + subtitle)
// ─────────────────────────────────────────────────────────────────────────

interface Employee {
  id: number;
  name: string;
  role: string;
  avatarUrl?: string;
}

const EMPLOYEES: Employee[] = [
  { id: 1, name: "Aditi Rao", role: "Frontend Engineer" },
  { id: 2, name: "Karthik Iyer", role: "Backend Engineer" },
  { id: 3, name: "Meera Nair", role: "Product Designer" },
  { id: 4, name: "Rohan Gupta", role: "QA Engineer" },
];

export function CustomItemRenderDemo() {
  const [value, setValue] = useState<string | number | null>(null);

  return (
    <Box maxW="360px">
      <ComboBox<Employee>
        data={EMPLOYEES}
        getLabel={(e) => e.name}
        getValue={(e) => e.id}
        value={value}
        onValueChange={setValue}
        placeholder="Assign an employee"
        renderItem={(employee, selected) => (
          <Stack direction="row" align="center" gap="2">
            <Avatar.Root size="xs">
              <Avatar.Fallback name={employee.name} />
            </Avatar.Root>
            <Box>
              <Text fontSize="sm" fontWeight={selected ? "bold" : "medium"}>
                {employee.name}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {employee.role}
              </Text>
            </Box>
          </Stack>
        )}
        renderSelected={(employee) => (
          <Stack direction="row" align="center" gap="2">
            <Avatar.Root size="2xs">
              <Avatar.Fallback name={employee.name} />
            </Avatar.Root>
            <Text fontSize="sm">{employee.name}</Text>
          </Stack>
        )}
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Infinite scrolling (remote, paginated)
// ─────────────────────────────────────────────────────────────────────────

export function InfiniteScrollDemo() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<StarWarsPerson[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [value, setValue] = useState<string | number | null>(null);

  const { isFetching } = useQuery({
    queryKey: ["swapi-people", query, page],
    queryFn: async () => {
      const res = await fetch(`https://swapi.py4e.com/api/people/?search=${encodeURIComponent(query)}&page=${page}`);
      const data = await res.json();
      setItems((prev) => (page === 1 ? data.results : [...prev, ...data.results]));
      setHasMore(Boolean(data.next));
      return data;
    },
  });

  const handleLoadMore = useCallback(() => setPage((p) => p + 1), []);

  return (
    <Box maxW="320px">
      <ComboBox<StarWarsPerson>
        data={items}
        getLabel={(p) => p.name}
        getValue={(p) => p.name}
        value={value}
        onValueChange={setValue}
        loading={isFetching && page === 1}
        infiniteScroll
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        placeholder="Scroll for more characters"
        onOpen={() => {
          if (items.length === 0) setPage(1);
        }}
      />
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// All demos in one place
// ─────────────────────────────────────────────────────────────────────────

export default function ComboBoxExamples() {
  const demos = useMemo(
    () => [
      { title: "Basic local search", Demo: BasicLocalSearchDemo },
      { title: "Remote search (TanStack Query + 500ms debounce)", Demo: RemoteSearchWithDebounceDemo },
      { title: "Multiple selection", Demo: MultiSelectDemo },
      { title: "React Hook Form integration", Demo: ReactHookFormDemo },
      { title: "Disabled state", Demo: DisabledDemo },
      { title: "Custom item renderer (avatar + subtitle)", Demo: CustomItemRenderDemo },
      { title: "Infinite scrolling", Demo: InfiniteScrollDemo },
    ],
    []
  );

  return (
    <Stack gap="8" p="6">
      {demos.map(({ title, Demo }) => (
        <Box key={title}>
          <Heading size="sm" mb="3">
            {title}
          </Heading>
          <Demo />
        </Box>
      ))}
    </Stack>
  );
}
