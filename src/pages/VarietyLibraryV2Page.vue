<template>
  <q-page class="q-pa-md">
    <div class="q-mb-lg">
      <div class="row items-center justify-between">
        <div>
          <h4 class="q-my-none">Библиотека сортов v2</h4>
          <p class="text-grey-6 q-mt-sm">
            Изучите разнообразие сортов перца со всего мира.<br />
            Сорта и описания взяты с сайта
            <a href="https://pepperseeds.ru" target="_blank" class="text-primary">pepperseeds.ru</a>
          </p>
          <div class="row q-col-gutter-md q-mt-sm">
            <div class="col-auto">
              <q-badge color="primary" outline> Сортов в базе: {{ varietiesCount }} </q-badge>
            </div>
            <div class="col-auto" v-if="lastUpdateText">
              <q-badge color="grey-7" outline> Последнее обновление: {{ lastUpdateText }} </q-badge>
            </div>
          </div>
        </div>
        <div>
          <div class="row q-col-gutter-sm">
            <q-btn
              v-if="isAdmin"
              color="primary"
              :loading="refreshing"
              icon="refresh"
              label="Обновить библиотеку"
              @click="refreshLibrary"
            />
            <q-btn
              v-if="isAdmin"
              color="secondary"
              :loading="store.loading && isImporting"
              icon="cloud_upload"
              label="Импорт сортов"
              @click="showImportDialog = true"
            />
          </div>
          <div>
            <q-badge color="grey-7" outline>
              Последнее обновление:
              <span v-if="lastUpdateText && lastUpdateText.length > 0">{{ lastUpdateText }}</span>
              <span v-else>Нет данных о последнем обновлении</span>
            </q-badge>
            <q-badge color="primary" outline v-if="store.lastManualUpdate">
              Последнее ручное обновление: {{ formatManualUpdate(store.lastManualUpdate) }}
            </q-badge>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.loading && !hasActiveSearch" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">Загрузка сортов...</div>
    </div>

    <!-- Индикатор загрузки при поиске/фильтрации -->
    <div v-if="isSearching" class="text-center q-pa-md">
      <q-spinner-dots size="40px" color="primary" />
      <div class="q-mt-sm text-caption">Поиск сортов...</div>
    </div>

    <div v-else-if="store.error" class="text-center q-pa-xl">
      <q-icon name="error" size="50px" color="negative" />
      <div class="q-mt-md text-negative">{{ store.error }}</div>
      <q-btn color="primary" label="Повторить" @click="store.fetchFirstPage" class="q-mt-md" />
    </div>

    <div v-else>
      <!-- Панель поиска и сортировки -->
      <div class="row q-col-gutter-md q-mb-md items-end">
        <div class="col-12 col-md-5">
          <q-select
            v-model="searchQuery"
            :options="autocompleteOptions"
            use-input
            input-debounce="300"
            label="Поиск по наименованию"
            dense
            clearable
            emit-value
            map-options
            hide-dropdown-icon
            prepend-icon="search"
            @filter="filterAutocomplete"
            @keyup.enter="handleSearch"
            @clear="handleClearSearch"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Начните вводить название сорта
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:append>
              <q-btn
                flat
                dense
                round
                icon="search"
                @click="handleSearch"
                :loading="isSearching"
              />
            </template>
          </q-select>
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="selectedSpecies"
            :options="speciesOptions"
            label="Фильтр по виду"
            dense
            clearable
            emit-value
            map-options
            prepend-inner-icon="category"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-btn
            color="primary"
            label="Найти"
            icon="search"
            @click="handleSearch"
            :loading="isSearching"
            class="full-width"
          />
        </div>
      </div>
      <!-- Информация о поиске -->
      <div v-if="hasActiveSearch" class="q-mb-md text-caption text-grey-6">
        <q-icon name="info" size="16px" class="q-mr-xs" />
        <span v-if="searchQuery || selectedSpecies">
          Поиск: {{ searchQuery ? `"${searchQuery}"` : '' }}
          {{ searchQuery && selectedSpecies ? '+ ' : '' }}
          {{ selectedSpecies ? `вид: ${selectedSpecies}` : '' }}
        </span>
        <q-btn
          flat
          dense
          size="sm"
          label="Очистить"
          icon="clear"
          @click="handleClearSearch"
          class="q-ml-sm"
        />
      </div>
      <!-- Виртуализация для больших списков (при поиске/фильтрации) -->
      <q-virtual-scroll
        v-if="hasActiveSearch && filteredItems.length > 30"
        :items="filteredItems"
        :virtual-scroll-item-size="350"
        :virtual-scroll-sticky-size-start="0"
        :virtual-scroll-sticky-size-end="0"
        separator
        class="q-virtual-scroll"
        style="height: 70vh; max-height: 800px;"
      >
        <template v-slot="{ item: variety, index }">
          <div class="q-pa-sm">
            <q-card class="variety-card-fixed">
              <q-card-section>
                <div class="text-h6 q-mb-xs">{{ variety.name }}</div>
                <div class="text-caption text-grey-7 q-mb-xs">
                  <q-icon name="science" size="16px" class="q-mr-xs" />{{ variety.species }}
                </div>
                <div v-if="variety.description" class="text-body2 q-mb-xs variety-desc-ellipsis">
                  {{ variety.description }}
                </div>
                <div v-if="variety.shu" class="q-mb-xs">
                  <q-icon name="whatshot" color="red" size="16px" class="q-mr-xs" />
                  <span class="text-caption text-grey-6">Острота:</span>
                  <span
                    >{{
                      Array.isArray(variety.shu) ? variety.shu.join(' – ') : variety.shu
                    }}
                    SHU</span
                  >
                </div>
                <div v-if="variety.color && variety.color.length" class="q-mb-xs">
                  <q-icon name="palette" color="primary" size="16px" class="q-mr-xs" />
                  <span class="text-caption text-grey-6">Цвета:</span>
                  <span>
                    <span
                      v-for="color in variety.color"
                      :key="color"
                      :title="color"
                      class="color-dot"
                      :style="{ backgroundColor: getColorHex(color) }"
                    ></span>
                  </span>
                </div>
                <div v-if="variety.length" class="q-mb-xs">
                  <q-icon name="straighten" color="teal" size="16px" class="q-mr-xs" />
                  <span class="text-caption text-grey-6">Длина:</span>
                  <span>{{ variety.length }} мм</span>
                </div>
                <div v-if="variety.weight" class="q-mb-xs">
                  <q-icon name="fitness_center" color="grey" size="16px" class="q-mr-xs" />
                  <span class="text-caption text-grey-6">Вес плода:</span>
                  <span>{{ variety.weight }}</span>
                </div>
                <div v-if="getPlantHeight(variety)" class="q-mb-xs">
                  <q-icon name="grass" color="green" size="16px" class="q-mr-xs" />
                  <span class="text-caption text-grey-6">Высота куста:</span>
                  <span>{{ getPlantHeight(variety) }}</span>
                </div>
                <div v-if="getFruitLength(variety)" class="q-mb-xs">
                  <q-icon name="straighten" color="blue" size="16px" class="q-mr-xs" />
                  <span class="text-caption text-grey-6">Длина плода:</span>
                  <span>{{ getFruitLength(variety) }}</span>
                </div>
                <div v-if="variety.daysToMaturity" class="q-mb-xs">
                  <q-icon name="event" color="orange" size="16px" class="q-mr-xs" />
                  <span class="text-caption text-grey-6">Дни до созревания:</span>
                  <span>{{ variety.daysToMaturity }}</span>
                </div>
                <div v-if="variety.origin" class="q-mb-xs">
                  <q-icon name="public" color="blue" size="16px" class="q-mr-xs" />
                  <span class="text-caption text-grey-6">Происхождение:</span>
                  <span>{{ variety.origin }}</span>
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat color="primary" label="Подробнее" @click="openDetails(variety)" />
                <q-btn v-if="isAdmin" flat color="secondary" icon="edit" @click="openEdit(variety)" />
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-virtual-scroll>

      <!-- Информация о количестве результатов при виртуализации -->
      <div v-if="hasActiveSearch && filteredItems.length > 30" class="text-center q-mt-md text-caption text-grey-6">
        Найдено {{ filteredItems.length }} результатов
      </div>
      
      <!-- Сообщение когда нет результатов поиска -->
      <div v-if="hasActiveSearch && filteredItems.length === 0 && !isSearching" class="text-center q-pa-xl">
        <q-icon name="search_off" size="50px" color="grey-6" />
        <div class="q-mt-md text-grey-6">Ничего не найдено</div>
        <div class="q-mt-sm text-caption text-grey-7">
          Попробуйте изменить поисковый запрос или очистить фильтры
        </div>
      </div>

      <!-- Обычный список для небольших результатов или пагинации -->
      <div v-if="hasActiveSearch && filteredItems.length <= 30" class="row q-col-gutter-md">
        <div
          v-for="variety in filteredItems"
          :key="variety.id"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <q-card class="q-mb-md variety-card-fixed">
            <q-card-section>
              <div class="text-h6 q-mb-xs">{{ variety.name }}</div>
              <div class="text-caption text-grey-7 q-mb-xs">
                <q-icon name="science" size="16px" class="q-mr-xs" />{{ variety.species }}
              </div>
              <div v-if="variety.description" class="text-body2 q-mb-xs variety-desc-ellipsis">
                {{ variety.description }}
              </div>
              <div v-if="variety.shu" class="q-mb-xs">
                <q-icon name="whatshot" color="red" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Острота:</span>
                <span
                  >{{
                    Array.isArray(variety.shu) ? variety.shu.join(' – ') : variety.shu
                  }}
                  SHU</span
                >
              </div>
              <div v-if="variety.color && variety.color.length" class="q-mb-xs">
                <q-icon name="palette" color="primary" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Цвета:</span>
                <span>
                  <span
                    v-for="color in variety.color"
                    :key="color"
                    :title="color"
                    class="color-dot"
                    :style="{ backgroundColor: getColorHex(color) }"
                  ></span>
                </span>
              </div>
              <div v-if="variety.length" class="q-mb-xs">
                <q-icon name="straighten" color="teal" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Длина:</span>
                <span>{{ variety.length }} мм</span>
              </div>
              <div v-if="variety.weight" class="q-mb-xs">
                <q-icon name="fitness_center" color="grey" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Вес плода:</span>
                <span>{{ variety.weight }}</span>
              </div>
              <div v-if="getPlantHeight(variety)" class="q-mb-xs">
                <q-icon name="grass" color="green" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Высота куста:</span>
                <span>{{ getPlantHeight(variety) }}</span>
              </div>
              <div v-if="getFruitLength(variety)" class="q-mb-xs">
                <q-icon name="straighten" color="blue" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Длина плода:</span>
                <span>{{ getFruitLength(variety) }}</span>
              </div>
              <div v-if="variety.daysToMaturity" class="q-mb-xs">
                <q-icon name="event" color="orange" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Дни до созревания:</span>
                <span>{{ variety.daysToMaturity }}</span>
              </div>
              <div v-if="variety.origin" class="q-mb-xs">
                <q-icon name="public" color="blue" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Происхождение:</span>
                <span>{{ variety.origin }}</span>
              </div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat color="primary" label="Подробнее" @click="openDetails(variety)" />
              <q-btn v-if="isAdmin" flat color="secondary" icon="edit" @click="openEdit(variety)" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
      
      <!-- Обычный список с пагинацией (когда нет активного поиска) -->
      <div v-if="!hasActiveSearch" class="row q-col-gutter-md">
        <div
          v-for="variety in store.items"
          :key="variety.id"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <q-card class="variety-card-fixed">
            <q-card-section>
              <div class="text-h6 q-mb-xs">{{ variety.name }}</div>
              <div class="text-caption text-grey-7 q-mb-xs">
                <q-icon name="science" size="16px" class="q-mr-xs" />{{ variety.species }}
              </div>
              <div v-if="variety.description" class="text-body2 q-mb-xs variety-desc-ellipsis">
                {{ variety.description }}
              </div>
              <div v-if="variety.shu" class="q-mb-xs">
                <q-icon name="whatshot" color="red" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Острота:</span>
                <span
                  >{{
                    Array.isArray(variety.shu) ? variety.shu.join(' – ') : variety.shu
                  }}
                  SHU</span
                >
              </div>
              <div v-if="variety.color && variety.color.length" class="q-mb-xs">
                <q-icon name="palette" color="primary" size="16px" class="q-mr-xs" />
                <span class="text-caption text-grey-6">Цвета:</span>
                <span>
                  <span
                    v-for="color in variety.color"
                    :key="color"
                    :title="color"
                    class="color-dot"
                    :style="{ backgroundColor: getColorHex(color) }"
                  ></span>
                </span>
              </div>
            </q-card-section>
            <q-card-actions>
              <q-btn flat color="primary" icon="info" @click="openDetails(variety)" label="Подробнее" />
              <q-btn v-if="isAdmin" flat color="secondary" icon="edit" @click="openEdit(variety)" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
      
      <div class="row justify-center q-mt-lg">
        <template v-if="!hasActiveSearch">
          <q-btn
            :disable="store.loading || store.currentPage === 1"
            icon="chevron_left"
            @click="store.fetchPrevPage"
            flat
            round
            class="q-mr-sm"
          />
          <q-btn
            :disable="store.loading || !store.hasNextPage"
            icon="chevron_right"
            @click="store.fetchNextPage"
            flat
            round
            class="q-ml-sm"
          />
        </template>
      </div>
    </div>

    <!-- Диалог редактирования цвета -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Редактировать цвета</div>
          <div class="q-mt-md">
            <div class="q-mb-sm">
              <q-select
                v-model="colorInput"
                :options="colorOptions"
                label="Выбрать цвет"
                dense
                emit-value
                map-options
              />
              <q-input v-model="customColor" label="Свой цвет (на русском)" dense class="q-mt-sm" />
              <q-btn flat color="primary" label="Добавить" @click="addColor" class="q-ml-sm" />
            </div>
            <div class="q-mb-sm">
              <q-select
                v-model="plantHeightSelect"
                :options="plantHeightOptions"
                label="Высота куста"
                dense
                emit-value
                map-options
              />
              <q-input
                v-if="plantHeightSelect === 'свой размер'"
                v-model="plantHeightCustom"
                label="Введите свой размер (см или диапазон)"
                dense
                class="q-mt-sm"
              />
            </div>
            <div class="q-mb-sm">
              <q-select
                v-model="fruitLengthSelect"
                :options="fruitLengthOptions"
                label="Длина плода"
                dense
                emit-value
                map-options
              />
              <q-input
                v-if="fruitLengthSelect === 'свой размер'"
                v-model="fruitLengthCustom"
                label="Введите свой размер (мм или диапазон)"
                dense
                class="q-mt-sm"
              />
            </div>
            <div class="q-mb-sm">
              <q-select
                v-model="fruitWeightSelect"
                :options="fruitWeightOptions"
                label="Вес плода"
                dense
                emit-value
                map-options
              />
              <q-input
                v-if="fruitWeightSelect === 'свой вариант'"
                v-model="fruitWeightCustom"
                label="Введите свой вариант (грамм или диапазон)"
                dense
                class="q-mt-sm"
              />
            </div>
            <div class="q-mb-sm">
              <q-select
                v-model="daysToMaturitySelect"
                :options="daysToMaturityOptions"
                label="Дни до созревания"
                dense
                emit-value
                map-options
              />
              <q-input
                v-if="daysToMaturitySelect === 'свой вариант'"
                v-model="daysToMaturityCustom"
                label="Введите свой вариант (например, 80-100 дней)"
                dense
                class="q-mt-sm"
              />
            </div>
            <div class="q-mb-sm">
              <q-input v-model="originInput" label="Происхождение" dense />
            </div>
            <div>
              <span v-for="color in editColors" :key="color" class="q-mr-sm">
                <span
                  class="color-dot"
                  :style="{ backgroundColor: getColorHex(color) }"
                  :title="color"
                ></span>
                <span>{{ color }}</span>
                <q-btn
                  flat
                  dense
                  icon="close"
                  size="xs"
                  color="negative"
                  @click="removeColor(color)"
                />
              </span>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn unelevated label="Сохранить" color="primary" @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Диалог подробностей -->
    <q-dialog v-model="showDetailsDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ detailsVariety?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-if="detailsVariety">
            <div class="q-mb-md text-caption text-grey-7">
              <q-icon name="science" size="16px" class="q-mr-xs" />{{ detailsVariety.species }}
            </div>
            <div class="q-mb-md">{{ detailsVariety.description }}</div>
            <div v-if="detailsVariety.shu" class="q-mb-xs">
              <q-icon name="whatshot" color="red" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Острота:</span>
              <span
                >{{
                  Array.isArray(detailsVariety.shu)
                    ? detailsVariety.shu.join(' – ')
                    : detailsVariety.shu
                }}
                SHU</span
              >
            </div>
            <div v-if="detailsVariety.color && detailsVariety.color.length" class="q-mb-xs">
              <q-icon name="palette" color="primary" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Цвета:</span>
              <span>
                <span
                  v-for="color in detailsVariety.color"
                  :key="color"
                  :title="color"
                  class="color-dot"
                  :style="{ backgroundColor: getColorHex(color) }"
                ></span>
              </span>
            </div>
            <div v-if="detailsVariety.length" class="q-mb-xs">
              <q-icon name="straighten" color="teal" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Длина:</span>
              <span>{{ detailsVariety.length }} мм</span>
            </div>
            <div v-if="detailsVariety.weight" class="q-mb-xs">
              <q-icon name="fitness_center" color="grey" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Вес плода:</span>
              <span>{{ detailsVariety.weight }}</span>
            </div>
            <div v-if="getPlantHeight(detailsVariety)" class="q-mb-xs">
              <q-icon name="grass" color="green" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Высота куста:</span>
              <span>{{ getPlantHeight(detailsVariety) }}</span>
            </div>
            <div v-if="getFruitLength(detailsVariety)" class="q-mb-xs">
              <q-icon name="straighten" color="blue" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Длина плода:</span>
              <span>{{ getFruitLength(detailsVariety) }}</span>
            </div>
            <div v-if="detailsVariety.daysToMaturity" class="q-mb-xs">
              <q-icon name="event" color="orange" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Дни до созревания:</span>
              <span>{{ detailsVariety.daysToMaturity }}</span>
            </div>
            <div v-if="detailsVariety.origin" class="q-mb-xs">
              <q-icon name="public" color="blue" size="16px" class="q-mr-xs" />
              <span class="text-caption text-grey-6">Происхождение:</span>
              <span>{{ detailsVariety.origin }}</span>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Диалог импорта сортов -->
    <q-dialog v-model="showImportDialog" persistent>
      <q-card style="min-width: 500px; max-width: 700px">
        <q-card-section>
          <div class="text-h6">Импорт сортов из JSON</div>
          <div class="text-caption text-grey-6 q-mt-sm">
            Загрузите JSON файл с сортами (например, all-peppers.json из скрипта парсинга)
          </div>
        </q-card-section>

        <q-card-section v-if="!isImporting">
          <q-file
            v-model="importFile"
            label="Выберите JSON файл"
            accept=".json"
            outlined
            dense
            @update:model-value="onFileSelected"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
          <div v-if="importFilePreview" class="q-mt-md">
            <q-badge color="info">
              Найдено сортов: {{ importFilePreview.length }}
            </q-badge>
          </div>
        </q-card-section>

        <q-card-section v-if="isImporting">
          <div class="text-subtitle2 q-mb-md">Импорт в процессе...</div>
          <q-linear-progress
            :value="importProgressPercent"
            color="primary"
            class="q-mb-md"
          />
          <div class="text-caption text-grey-6 q-mb-sm">
            {{ store.importProgress.current }} / {{ store.importProgress.total }}
          </div>
          <div v-if="store.importProgress.currentVariety" class="text-body2 q-mb-sm">
            Текущий сорт: <strong>{{ store.importProgress.currentVariety }}</strong>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col">
              <q-badge color="positive">
                Добавлено: {{ store.importProgress.added }}
              </q-badge>
            </div>
            <div class="col">
              <q-badge color="warning">
                Пропущено: {{ store.importProgress.skipped }}
              </q-badge>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Отмена"
            color="primary"
            v-close-popup
            :disable="isImporting"
          />
          <q-btn
            unelevated
            label="Импортировать"
            color="primary"
            @click="startImport"
            :loading="store.loading && isImporting"
            :disable="!importFilePreview || isImporting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useVarietyLibraryV2Store, type PepperVarietyV2 } from 'stores/variety-library-v2';
import { useUserStore } from 'stores/user-store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useQuasar } from 'quasar';

const store = useVarietyLibraryV2Store();
const userStore = useUserStore();
const $q = useQuasar();

const editingVariety = ref(null as any);
const showEditDialog = ref(false);
const editColors = ref<string[]>([]);
const colorInput = ref('');
const showDetailsDialog = ref(false);
const detailsVariety = ref(null as any);
const colorOptions = [
  'красный',
  'оранжевый',
  'желтый',
  'зелёный',
  'зеленый',
  'фиолетовый',
  'пурпурный',
  'белый',
  'чёрный',
  'черный',
  'коричневый',
  'шоколадный',
  'розовый',
  'синий',
  'голубой',
  'кремовый',
];
const customColor = ref('');
const plantHeightOptions = ['до 50 см', 'от 50 см до 1м', 'выше 1м', 'свой размер'];
const fruitLengthOptions = [
  'до 5 см',
  'от 5 до 10 см',
  'больше 10 см',
  'больше 20 см',
  'свой размер',
];
const fruitWeightOptions = [
  'до 10 грамм',
  'от 10 грамм до 50 грамм',
  'от 50 грамм до 100 грамм',
  'больше 100 грамм',
  'больше 200 грамм',
  'свой вариант',
];
const plantHeightSelect = ref('');
const plantHeightCustom = ref('');
const fruitLengthSelect = ref('');
const fruitLengthCustom = ref('');
const fruitWeightSelect = ref('');
const fruitWeightCustom = ref('');
const daysToMaturityOptions = [
  '30-60 дней',
  '60-90 дней',
  '90-120 дней',
  'больше 120 дней',
  'свой вариант',
];
const daysToMaturitySelect = ref('');
const daysToMaturityCustom = ref('');
const originInput = ref('');

const isAdmin = computed(() => userStore.user?.email === 'lowdog136@gmail.com');

// Импорт сортов
const showImportDialog = ref(false);
const importFile = ref<File | null>(null);
const importFilePreview = ref<any[] | null>(null);
const isImporting = ref(false);

const importProgressPercent = computed(() => {
  if (store.importProgress.total === 0) return 0;
  return store.importProgress.current / store.importProgress.total;
});

const onFileSelected = (file: File | null) => {
  if (!file) {
    importFilePreview.value = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content);
      const varieties = Array.isArray(data) ? data : [];
      importFilePreview.value = varieties;
      console.log('Загружено сортов из файла:', varieties.length);
    } catch (error) {
      console.error('Ошибка парсинга JSON:', error);
      $q.notify({
        color: 'negative',
        message: 'Ошибка: Неверный формат JSON файла',
        icon: 'error',
      });
      importFilePreview.value = null;
    }
  };
  reader.readAsText(file);
};

const startImport = async () => {
  if (!importFilePreview.value || importFilePreview.value.length === 0) {
    $q.notify({
      color: 'negative',
      message: 'Нет данных для импорта',
      icon: 'error',
    });
    return;
  }

  isImporting.value = true;
  try {
    // Подготавливаем данные для импорта
    const varietiesToImport = importFilePreview.value.map((v: any) => ({
      name: v.name || '',
      species: v.species || undefined,
      description: v.description || undefined,
      shu: v.shu || undefined,
      color: v.color || undefined,
      length: v.length || undefined,
      weight: v.weight || undefined,
      plantHeight: v.plantHeight || v.height || undefined,
      fruitLength: v.fruitLength || undefined,
      daysToMaturity: v.daysToMaturity || v.maturity || undefined,
      origin: v.origin || undefined,
    }));

    const result = await store.importVarieties(varietiesToImport, (progress) => {
      // Обновление прогресса происходит автоматически через store
      console.log('Прогресс импорта:', progress);
    });

    $q.notify({
      color: 'positive',
      message: `Импорт завершен! Добавлено: ${result.added}, Пропущено: ${result.skipped}`,
      icon: 'check_circle',
      timeout: 5000,
    });

    // Закрываем диалог и обновляем библиотеку
    showImportDialog.value = false;
    importFile.value = null;
    importFilePreview.value = null;

    // Обновляем библиотеку
    await store.fetchFirstPage();
  } catch (error: any) {
    console.error('Ошибка импорта:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка импорта: ' + (error.message || 'Неизвестная ошибка'),
      icon: 'error',
    });
  } finally {
    isImporting.value = false;
  }
};

// Загружаем сохраненные фильтры из localStorage
const savedFilters = localStorage.getItem('varietyLibraryFilters');
const savedSearch = savedFilters ? JSON.parse(savedFilters).search || '' : '';
const savedSpecies = savedFilters ? JSON.parse(savedFilters).species || '' : '';

const searchQuery = ref(savedSearch);
const selectedSpecies = ref(savedSpecies);

// Флаг: был ли выполнен поиск (показывать результаты)
const hasActiveSearch = ref(false);

// Автодополнение для поиска
const allVarietyNames = ref<string[]>([]);
const autocompleteOptions = ref<string[]>([]);

// Загружаем все названия для автодополнения
const loadVarietyNames = async () => {
  try {
    // Загружаем все сорта для автодополнения (только один раз или при необходимости)
    if (allVarietyNames.value.length === 0) {
      await store.fetchAllItems();
      allVarietyNames.value = store.allItems
        .map((v) => v.name)
        .filter((name) => name && name.trim().length > 0)
        .sort();
    }
  } catch (error) {
    console.error('Ошибка загрузки названий для автодополнения:', error);
  }
};

// Фильтрация автодополнения
const filterAutocomplete = (val: string, update: (cb: () => void) => void) => {
  update(() => {
    if (val === '') {
      autocompleteOptions.value = [];
    } else {
      const needle = val.toLowerCase();
      autocompleteOptions.value = allVarietyNames.value
        .filter((name) => name.toLowerCase().includes(needle))
        .slice(0, 20); // Ограничиваем до 20 вариантов
    }
  });
};

const FIXED_SPECIES = [
  'Capsicum annuum',
  'Capsicum chinense',
  'Capsicum baccatum',
  'Capsicum pubescens',
  'Capsicum frutescens',
];

// Мемоизируем speciesOptions для оптимизации
const speciesOptions = computed(() => {
  // Используем только текущую страницу для избежания обработки всех элементов
  const source = store.items;
  const set = new Set<string>(FIXED_SPECIES);
  source.forEach((v) => {
    if (v.species) set.add(v.species);
  });
  return Array.from(set).sort();
});

// Используем Firestore поиск вместо клиентской фильтрации
const searchResults = ref<PepperVarietyV2[]>([]);
const isSearching = ref(false);

// Флаг для предотвращения множественных одновременных запросов
let isSearchInProgress = false;

// Функция поиска (вызывается только по кнопке или Enter)
const performSearch = async (q: string, s: string | null) => {
  // Предотвращаем множественные одновременные запросы
  if (isSearchInProgress) {
    return;
  }

  // Проверяем, есть ли что искать
  const hasSearch = q && q.trim().length >= 2;
  const hasFilter = s && s.trim().length > 0;

  if (!hasSearch && !hasFilter) {
    // Если нет поиска и фильтра, очищаем результаты и скрываем поиск
    searchResults.value = [];
    hasActiveSearch.value = false;
    return;
  }

  // Устанавливаем флаг активного поиска
  hasActiveSearch.value = true;

  isSearchInProgress = true;
  isSearching.value = true;
  try {
    // Используем Firestore поиск
    const results = await store.searchVarieties(
      hasSearch ? q.trim() : '',
      hasFilter ? s || undefined : undefined
    );
    searchResults.value = results;

    // Сохраняем фильтры в localStorage
    localStorage.setItem('varietyLibraryFilters', JSON.stringify({
      search: q || '',
      species: s || '',
    }));
  } catch (error) {
    console.error('Ошибка поиска:', error);
    $q.notify({
      color: 'negative',
      message: 'Ошибка при выполнении поиска',
      icon: 'error',
    });
  } finally {
    isSearching.value = false;
    isSearchInProgress = false;
  }
};

// Обработчик поиска (по кнопке или Enter)
const handleSearch = () => {
  performSearch(searchQuery.value || '', selectedSpecies.value || null);
};

// Очистка поиска
const handleClearSearch = () => {
  searchQuery.value = '';
  selectedSpecies.value = null;
  searchResults.value = [];
  hasActiveSearch.value = false;
  localStorage.removeItem('varietyLibraryFilters');
};

const filteredItems = computed(() => {
  // Если есть активный поиск, используем результаты поиска
  if (hasActiveSearch.value) {
    return searchResults.value;
  }
  // Иначе возвращаем пустой массив (показывается обычная пагинация)
  return [];
});

function openEdit(variety: any) {
  editingVariety.value = { ...variety };
  editColors.value = Array.isArray(variety.color) ? [...variety.color] : [];
  // Высота куста
  if (typeof variety.plantHeight === 'string' && plantHeightOptions.includes(variety.plantHeight)) {
    plantHeightSelect.value = variety.plantHeight;
    plantHeightCustom.value = '';
  } else if (variety.plantHeight) {
    plantHeightSelect.value = 'свой размер';
    plantHeightCustom.value = String(variety.plantHeight);
  } else {
    plantHeightSelect.value = '';
    plantHeightCustom.value = '';
  }
  // Длина плода
  if (typeof variety.fruitLength === 'string' && fruitLengthOptions.includes(variety.fruitLength)) {
    fruitLengthSelect.value = variety.fruitLength;
    fruitLengthCustom.value = '';
  } else if (variety.fruitLength) {
    fruitLengthSelect.value = 'свой размер';
    fruitLengthCustom.value = String(variety.fruitLength);
  } else {
    fruitLengthSelect.value = '';
    fruitLengthCustom.value = '';
  }
  // Вес плода
  if (typeof variety.weight === 'string' && fruitWeightOptions.includes(variety.weight)) {
    fruitWeightSelect.value = variety.weight;
    fruitWeightCustom.value = '';
  } else if (variety.weight) {
    fruitWeightSelect.value = 'свой вариант';
    fruitWeightCustom.value = String(variety.weight);
  } else {
    fruitWeightSelect.value = '';
    fruitWeightCustom.value = '';
  }
  // Дни до созревания
  if (
    typeof variety.daysToMaturity === 'string' &&
    daysToMaturityOptions.includes(variety.daysToMaturity)
  ) {
    daysToMaturitySelect.value = variety.daysToMaturity;
    daysToMaturityCustom.value = '';
  } else if (variety.daysToMaturity) {
    daysToMaturitySelect.value = 'свой вариант';
    daysToMaturityCustom.value = String(variety.daysToMaturity);
  } else {
    daysToMaturitySelect.value = '';
    daysToMaturityCustom.value = '';
  }
  // Происхождение
  originInput.value = variety.origin || '';
  showEditDialog.value = true;
  customColor.value = '';
}
async function saveEdit() {
  if (!editingVariety.value) return;
  const docRef = doc(db, 'varieties_v2', editingVariety.value.id);
  const updateData: any = { color: editColors.value };
  // Высота куста
  if (plantHeightSelect.value === 'свой размер' && plantHeightCustom.value) {
    updateData.plantHeight = plantHeightCustom.value;
  } else if (plantHeightSelect.value) {
    updateData.plantHeight = plantHeightSelect.value;
  }
  // Длина плода
  if (fruitLengthSelect.value === 'свой размер' && fruitLengthCustom.value) {
    updateData.fruitLength = fruitLengthCustom.value;
  } else if (fruitLengthSelect.value) {
    updateData.fruitLength = fruitLengthSelect.value;
  }
  // Вес плода
  if (fruitWeightSelect.value === 'свой вариант' && fruitWeightCustom.value) {
    updateData.weight = fruitWeightCustom.value;
  } else if (fruitWeightSelect.value) {
    updateData.weight = fruitWeightSelect.value;
  }
  // Дни до созревания
  if (daysToMaturitySelect.value === 'свой вариант' && daysToMaturityCustom.value) {
    updateData.daysToMaturity = daysToMaturityCustom.value;
  } else if (daysToMaturitySelect.value) {
    updateData.daysToMaturity = daysToMaturitySelect.value;
  }
  // Происхождение
  updateData.origin = originInput.value;
  await updateDoc(docRef, updateData);
  editingVariety.value.color = [...editColors.value];
  editingVariety.value.plantHeight = updateData.plantHeight;
  editingVariety.value.fruitLength = updateData.fruitLength;
  editingVariety.value.weight = updateData.weight;
  editingVariety.value.daysToMaturity = updateData.daysToMaturity;
  editingVariety.value.origin = updateData.origin;
  store.setLastManualUpdate();
  showEditDialog.value = false;
  if (store.currentPage > 1) {
    await store.fetchPrevPage();
    await store.fetchNextPage();
  } else {
    await store.fetchFirstPage();
  }
}
function addColor() {
  if (colorInput.value && !editColors.value.includes(colorInput.value)) {
    editColors.value.push(colorInput.value);
    colorInput.value = '';
  }
  if (customColor.value && !editColors.value.includes(customColor.value)) {
    editColors.value.push(customColor.value);
    customColor.value = '';
  }
}
function removeColor(color: string) {
  editColors.value = editColors.value.filter((c) => c !== color);
}
function openDetails(variety: any) {
  detailsVariety.value = variety;
  showDetailsDialog.value = true;
}

function getColorHex(color: string) {
  const map: Record<string, string> = {
    красный: '#e53935',
    оранжевый: '#fb8c00',
    желтый: '#fdd835',
    зеленый: '#43a047',
    зелёный: '#43a047',
    фиолетовый: '#8e24aa',
    пурпурный: '#ad1457',
    белый: '#fafafa',
    черный: '#212121',
    чёрный: '#212121',
    коричневый: '#6d4c41',
    шоколадный: '#795548',
    розовый: '#ec407a',
    синий: '#1e88e5',
    голубой: '#00bcd4',
    кремовый: '#fff9c4',
  };
  return map[color.toLowerCase()] || '#bdbdbd';
}

function getPlantHeight(variety: any) {
  if (typeof variety.plantHeight === 'number') return `${variety.plantHeight} см`;
  if (typeof variety.plantHeight === 'string') return variety.plantHeight;
  if (Array.isArray(variety.plantHeight)) return variety.plantHeight.join('–') + ' см';
  if (typeof variety.plantHeight === 'object' && variety.plantHeight) {
    if (variety.plantHeight.min && variety.plantHeight.max)
      return `${variety.plantHeight.min}–${variety.plantHeight.max} см`;
    if (variety.plantHeight.value) return `${variety.plantHeight.value} см`;
  }
  return '';
}
function getFruitLength(variety: any) {
  if (typeof variety.fruitLength === 'number') return `${variety.fruitLength} мм`;
  if (typeof variety.fruitLength === 'string') return variety.fruitLength;
  if (Array.isArray(variety.fruitLength)) return variety.fruitLength.join('–') + ' мм';
  if (typeof variety.fruitLength === 'object' && variety.fruitLength) {
    if (variety.fruitLength.min && variety.fruitLength.max)
      return `${variety.fruitLength.min}–${variety.fruitLength.max} мм`;
    if (variety.fruitLength.value) return `${variety.fruitLength.value} мм`;
  }
  return '';
}

const varietiesCount = computed(() => {
  // Если allItems уже загружены (или идет фильтрация) — показываем их длину (вся база)
  if (store.allItems.length > 0) return store.allItems.length;
  // Иначе — только текущая страница
  return store.items.length;
});

function getUpdateTime(docRef: any): number | null {
  if (!docRef) return null;
  if (docRef.metadata && docRef.metadata.updateTime) {
    return new Date(docRef.metadata.updateTime).getTime();
  }
  if (docRef.updateTime) {
    return new Date(docRef.updateTime).getTime();
  }
  return null;
}

// Оптимизируем вычисление lastUpdateText - вычисляем только при необходимости
const lastUpdateText = computed(() => {
  // Используем только текущую страницу для избежания обработки всех элементов
  const arr = store.items;
  if (arr.length === 0) return '';
  
  // Обрабатываем только первые элементы для оптимизации
  const sample = arr.slice(0, 10);
  const times = sample.map((v: any) => getUpdateTime((v as any)._docRef)).filter(Boolean) as number[];
  if (!times.length) return '';
  const maxTime = Math.max(...times);
  return new Date(maxTime).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

// Убрали автодополнение, так как теперь поиск по кнопке

const refreshing = ref(false);
async function refreshLibrary() {
  refreshing.value = true;
  try {
    await Promise.all([store.fetchFirstPage(), store.fetchAllItems()]);
    store.setLastManualUpdate();
    $q.notify({
      color: 'positive',
      message: 'Библиотека обновлена',
      icon: 'refresh',
    });
  } catch (e) {
    $q.notify({
      color: 'negative',
      message: 'Ошибка при обновлении библиотеки',
      icon: 'error',
    });
  } finally {
    refreshing.value = false;
  }
}

function formatManualUpdate(dateStr: string) {
  return new Date(dateStr).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(async () => {
  // Загружаем первую страницу
  await store.fetchFirstPage();

  // Загружаем названия для автодополнения
  await loadVarietyNames();

  // Если есть сохраненные фильтры, восстанавливаем их, но не выполняем поиск автоматически
  if (savedSearch || savedSpecies) {
    searchQuery.value = savedSearch;
    selectedSpecies.value = savedSpecies;
    // Пользователь может сам нажать "Найти" если хочет
  }
});
</script>

<style scoped>
.variety-card-fixed {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.variety-desc-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 44px;
}
.color-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 4px;
  border: 1px solid #ccc;
  vertical-align: middle;
}
</style>
